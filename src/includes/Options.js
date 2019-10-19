import React, { FC, cloneElement, ReactChild, ReactNode, createContext, useState, useEffect, useContext, useRef } from 'react';
import styled from 'styled-components';
import produce from 'immer';

const { POSITIVE_INFINITY:MAX, NEGATIVE_INFINITY:MIN } = Number;

interface IContext {
  update(cb:any, init?:boolean): void,
  state: any,
  ready: boolean,
 };

export const Context = createContext<IContext>({ update: () => {}, state: {}, ready: false });
export const take = (fn:any) => ({ state }:any) => fn(state);

interface IProvider {
  children: ReactNode | null;
  name: string,
};

export const Provider: FC<IProvider> = ({ children, name }) => {
  const [ state, setState ] = useState(JSON.parse(window.sessionStorage.getItem(`Option:${name}`) || '{}'));
  const [ ready, setReady ] = useState(false);
  const initial = useRef(state);
  const timeout:any = useRef(null);
  useEffect(() => {
    setReady(true);
    setState(initial.current);
  }, []);
  useEffect(() => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      window.sessionStorage.setItem(`Option:${name}`, JSON.stringify(state));
      timeout.current = null;
    }, 250);
  }, [ state ]);
  const update = (cb:any, init:boolean = false):void => {
    if (init) initial.current = cb(initial.current);
    else setState(cb(state));
  }
  const reset = () => {
    window.sessionStorage.removeItem(`Option:${name}`);
    setTimeout(() => window.location.reload(), 100);
  }
  return (
    <Context.Provider value={{ update, state, ready }}>
      {children}
      <button onClick={reset}>RESET</button>
    </Context.Provider>
  );
};

interface IFloat {
  name: string | number,
  value: number,
  min?: number,
  max?: number,
  step?: number,
  decimals?: number,
};

export const Float: FC<IFloat> = ({ name, value, min = MIN, max = MAX, step = 0.1, decimals = 2 }) => {
  const [ pending, setPending ] = useState(null);
  const { update, state } = useContext(Context);
  const scroll = useRef(0);
  useEffect(() => {
    console.log('FLOAT.MOUNTED', name, value, 'BEFORE');
    update(produce((draft:any) => {
      console.log('FLOAT.MOUNTED', name, value, 'INSIDE #1');
      if (draft[name] !== undefined) return;
      console.log('FLOAT.MOUNTED', name, value, 'INSIDE #2');
      draft[name] = value;
    }), true);
  }, []);
  const onChange = (e:any) => {
    const strValue = e.target.value; 
    const numValue = Math.min(max, Math.max(min, parseFloat(strValue))); if (strValue === "" || numValue.toString() !== strValue) {
      setPending(strValue);
    } else {
      setPending(null);
      console.log("FLOAT.UPDATE()", name, numValue);
      update(produce((draft:any) => {
        draft[name] = numValue;
      }));
    }
  };
  const onWheel = (e:any) => {
    if (pending !== null) return;
    const delta = e.deltaY * 0.1;
    if (scroll.current === 0) {
      window.requestAnimationFrame(() => {
        update(produce((draft:any) => {
          draft[name] = Math.min(max, Math.max(min, draft[name] - scroll.current * step));
        }));
        scroll.current = 0;
      });
    }
    scroll.current += delta;
  };
  const format = (v:number):any => (v * Math.pow(10, decimals) | 0) / Math.pow(10, decimals);
  return (
    <Input
      value={pending !== null ? pending : format(state.hasOwnProperty(name) ? state[name] : value)}
      onChange={onChange}
      onWheel={onWheel}
      pending={pending !== null}
    />
  );
};

interface IBool {
  name: string | number,
  value: boolean,
};

export const Bool: FC<IBool> = ({ name, value }) => {
  const { update, state } = useContext(Context);
  useEffect(() => update(produce((draft:any) => {
    if (draft[name] !== undefined) return;
    draft[name] = value;
  }), true), []);
  const onChange = () => update(produce((draft:any) => {
    draft[name] = !draft[name];
  }));
  return (
    <Input
      type="checkbox"
      checked={state.hasOwnProperty(name) ? state[name] : value}
      onChange={onChange}
      pending={false}
    />
  );
};

interface ISelect {
  name: string | number,
  value: any[],
};

export const Select: FC<ISelect> = ({ name, value }) => {
  const { update, state } = useContext(Context);
  useEffect(() => update(produce((draft:any) => {
    if (draft[name] !== undefined) return;
    draft[name] = value[0];
  }), true), []);
  const onChange = (e:any) => update(produce((draft:any) => {
    draft[name] = e.target.value;
  }));
  const current = state.hasOwnProperty(name) ? state[name] : value[0];
  return (
    <select value={current} onChange={onChange}>
      {value.map((choice:any, index:number) => (
        <option key={index} value={choice}>{choice}</option>
      ))}
    </select>
  );
};

interface IVector {
  name: string,
  value: number[],
  min?: number,
  max?: number,
  step?: number,
  decimals?: number,
};

export const Vector: FC<IVector> = ({ name, value, ...props }) => {
  const context = useContext(Context);
  const state = context.state[name] || [];
  useEffect(() => context.update(produce((draft:any) => {
    if (draft[name] !== undefined) return;
    draft[name] = value;
  }), true), []);
  const update = (cb:any, init:boolean = false):void => {
    if (init) return;
    context.update(produce((draft:any) => {
      draft[name] = cb(draft[name]);
    }));
  };
  return (
    <Context.Provider value={{...context, update, state }}>
      {value.map((value:number, index:number) => (
        <Float key={index} {...props} name={index} value={value} />
      ))}
    </Context.Provider>
  );
};

interface ISection {
  children: ReactNode,
  header?: string,
  name: string | number,
};

export const SectionController: FC<ISection> = ({ children, name }) => {
  const context = useContext(Context);
  const state = context.state[name] || {};
  const initial = useRef(state);
  useEffect(() => {
    console.log('SECTION.MOUNTED', name);
    context.update(produce((draft:any) => {
      console.log('SECTION.MOUNTED', name, 'INSIDE #1', 'initial.current', initial.current);
      draft[name] = initial.current;
    }), true);
  }, []);
  const update = (cb:any, init:boolean = false):void => {
    console.log('SECTION.UPDATE(', init, context.ready, ')', name);
    if (init) {
      initial.current = cb(initial.current);
    }
    else {
      console.log('SECTION.UPDATE(', init, context.ready, ')', name, 'BEFORE');
      context.update(produce((draft:any) => {
        console.log('SECTION.UPDATE(', init, context.ready, ')', name, 'INSIDE');
        draft[name] = cb(draft[name]);
      }));
    }
  };
  return  <Context.Provider value={{ update, state, ready: context.ready}} children={children} />;
};

export const Section: FC<ISection> = props => (
  <SectionContainer>
    <SectionHeader>
      <span>{props.header || props.name}</span>
    </SectionHeader>
    <SectionBody>
      <SectionController {...props} />
    </SectionBody>
  </SectionContainer>
);

interface IList {
  children: ReactNode,
  name: string,
};

export const List: FC<IList> = ({ children, name }) => {
  const context = useContext(Context);
  const state = context.state[name] || [];
  const [ list, setList ] = useState(Array.from(Array(state.length)));
  const initial = useRef(state);
  useEffect(() => context.update(produce((draft:any) => {
    draft[name] = initial.current;
  }), true), []);
  const update = (cb:any, init:boolean = false):void => {
    console.log('LIST.UPDATE(', init, context.ready, ')', name);
    if (init) {
      if (!context.ready) initial.current = cb(initial.current);
      else {
        console.log('LIST.UPDATE(', init, context.ready, ')', name, 'BEFORE', '#1');
        context.update(produce((draft:any) => {
          console.log('LIST.UPDATE(', init, context.ready, ')', name, 'INSIDE', '#1');
          draft[name] = cb(draft[name]);
        }));
      }
    } else {
      console.log('LIST.UPDATE(', init, context.ready, ')', name, 'BEFORE', '#2');
      context.update(produce((draft:any) => {
        console.log('LIST.UPDATE(', init, context.ready, ')', name, 'INSIDE', '#2');
        draft[name] = cb(draft[name]);
      }));
    }
  };
  const increment = () => {
    setList(Array.from(Array(list.length + 1)));
  };
  const decrement = () => {
    setList(list.slice(0, -1));
    context.update(produce((draft:any) => {
      draft[name].pop();
    }));
  };
  const remove = (index:number) => () => {
    setList([...list.slice(0, index), ...list.slice(index+1)]);
    context.update(produce((draft:any) => {
      draft[name] = [...draft[name].slice(0, index), ...draft[name].slice(index+1)];
    }));
  };
  return (
    <ListContainer>
      <ListHeader>
        <span>{name}</span>
        <Button onClick={increment}>+</Button>
        <Button onClick={decrement}>-</Button>
      </ListHeader>
      <ListBody>
        <Context.Provider value={{ update, state, ready: context.ready }}>
          {list.map((_:any, index:number) => (
            <ListItem key={index}>
              <SectionController name={index} children={children} />
              <Button onClick={remove(index)}>x</Button>
            </ListItem>
          ))}
        </Context.Provider>
      </ListBody>
    </ListContainer>
  );
};


interface IEvent {
  onReady?(state:any): void,
  onChange?(state:any): void,
};
export const Event: FC<IEvent> = ({ onReady, onChange }) => {
  const { state, ready } = useContext(Context);
  const previous = useRef(false);
  useEffect(() => {
    if (ready) {
      if (onReady && !previous.current) onReady(state);
      else if (onChange) onChange(state);
    }
    previous.current = ready;
  }, [ state, ready ]);
  return null;
};

interface IVisible {
  value: boolean,
  children: ReactChild,
};

export const Visible: FC<IVisible> = ({ children, value }:any) => cloneElement(children, {
  style: {
    display: value ? 'block' : 'none',
  }
});

interface IDrawer {
  children: ReactNode,
};
export const Drawer: FC<IDrawer> = ({ children }) => {
  const [ open, set ] = useState(false);
  return (
    <DrawerContainer>
      <DrawerOuterWrapper>
        <DrawerInnerWrapper>
          {children}
        </DrawerInnerWrapper>
      </DrawerOuterWrapper>
    </DrawerContainer>
  );
};

interface IRow {
  header: string,
  children: ReactNode,
};
export const Row: FC<IRow> = ({ header, children }) => (
  <RowContainer>
    <Label>{header}</Label>
    {children}
  </RowContainer>
);

export const DrawerContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 256px;
  background: #124A;
  border-bottom: 2px solid #2486;
`;

export const DrawerOuterWrapper = styled.div`
  overflow: hidden;
  padding: 0.25rem;
`;

export const DrawerInnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  color: white;
  font-size: 0.7rem;
  position: relative;
`;

export const RowContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: stretch;
`;

export const Label = styled.span`
  line-height: 1rem;
  display: flex;
  padding: 0 0 0 0.25rem;
`;

export const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  flex: 1 0 auto;
  margin-bottom: 0.25rem;
`;

export const SectionHeader = styled.div`
  padding: 0.25rem 0 0.25rem 0;
  & > span {
    font-weight: bold;
    font-size: 0.7rem;
    color: #FFF8;
    letter-spacing: -1px;
  }
  & input {
    width: auto;
  }
`;

interface ISSectiobBody { 
  visible?: boolean,
};

export const SectionBody = styled.div`
  display: ${({ visible = true }:ISSectiobBody) => visible ? 'flex' : 'none'};
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
`;

export const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
`;

export const ListHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: stretch;
  & > span:first-child {
    flex: 1 0 auto;
  }
  & > button {
    flex: 0 1 auto;
  }
`;

export const ListBody = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
`;

export const ListItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: stretch;
  & > div:first-child {
    flex-direction: row;
    & > div:last-child {
      flex: 1 0 auto;
    }
  }
  & > button:last-child {
    flex: 0 1 auto;
  }
`;

interface ISInput {
  pending: boolean,
};

export const Input = styled.input`
  flex: 1 0 auto;
  border: 0;
  color: white;
  min-width: 0;
  width: 0;
  font-size: 0.6rem;
  display: inline-block;
  background: ${(props:ISInput) => props.pending ? 'red' : '#0006'};
  padding: 0.1rem 0.25rem;
  & + & {
  }
`;

export const Button = styled.button`
  flex: 1 0 auto;
  border: 0;
  color: white;
  background: #0006;
  font-size: 0.6rem;
  & + & {
  }
`;


interface ISGrid {
  columns: string,
};

export const Grid = styled.div`
  display: grid;
  grid-template-columns: ${(props:ISGrid) => props.columns};
  grid-gap: 1px;
  margin-top: 1px;
  & > * {
    // margin-right: 1px;
  }
  & > input {
    width: auto;
  }
`;
//     at Options.jsx:78
//     at Options.jsx:114
//     at Options.jsx:78
//     at Object.update (Options.jsx:23)
//     at Object.update (Options.jsx:73)
//     at Object.update (Options.jsx:109)
//     at update (Options.jsx:73)
//     at Options.jsx:41