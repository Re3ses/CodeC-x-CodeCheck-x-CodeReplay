"use client"
import AttentionView from './attentionSingle';

export default function Page() {
    const code1 = "This is a very long sentence that contains many more words than the previous sentences, designed specifically to evaluate how the length of the input strings impacts the time it takes for the attention visualization to load using the bertviz library in a Google Colaboratory notebook environment.";
    const code2 = "And here we have a second very long sentence, comparable in length to the first one, which will be used as the second input to the bertviz visualization function so that we can accurately measure the loading time and observe any potential differences based on the increased text length.";

    return <AttentionView code1={code1} code2={code2} />;
}