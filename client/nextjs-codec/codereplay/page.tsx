import CodeEditor from './CodeEditor';

export default function CodeReplayPage() {
  return (
    <div className="w-full p-4">
      <h1 className="text-2xl font-bold mb-6">Code Replay</h1>
      <CodeEditor
        problem="sample-problem-1"
        room="practice-room"
        language="javascript"
        initialCode="// Write your code here"
      />
    </div>
  );
}