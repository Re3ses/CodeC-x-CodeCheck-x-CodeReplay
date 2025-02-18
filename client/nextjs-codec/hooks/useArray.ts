import { useState } from 'react';

export default function useArray(initial: any[] = []) {
  const [array, setArray] = useState<any[]>(initial);

  function push(data: any) {
    setArray([...array, data]);
  }

  function pop() {
    const arrayCopy = [...array];
    arrayCopy.pop();
    setArray(arrayCopy);
  }

  function filter(callback: any) {
    setArray((array) => array.filter(callback));
  }

  function clear() {
    setArray([]);
  }

  return { array, set: setArray, push, pop, filter, clear };
}
