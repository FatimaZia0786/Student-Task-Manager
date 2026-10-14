import { useState, useEffect } from "react";

function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("Button clicked!");
  }, [count]);

  return (
    <button onClick={() => setCount(count + 1)}>
      Click Me {count}
    </button>
  );
}

export default App;