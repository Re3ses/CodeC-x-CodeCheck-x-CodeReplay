"use client"
import AttentionView from './attentionSingle';

export default function Page() {
    const code1 = "This a code snippet\n This a line break";
    const code2 = "This is another code snippet";

    return <AttentionView code1={code1} code2={code2} />;
}