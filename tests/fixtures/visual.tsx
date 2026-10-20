// Development-only visual fixture for reviewing every eligible 3D quiz view.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {AnatomyQuestion} from '../../src/AnatomyQuestion';
import {anatomyQuestions} from '../../src/anatomyQuestions';
import '../../src/styles.css';
import '../../src/atlas-workspace.css';
const questions=anatomyQuestions({anatomy:true,system:'',region:'',structure:'',anatomyTopic:''} as any,(answer,all)=>[answer,...all.filter(x=>x!==answer).slice(0,3)]).filter(q=>q.anatomy);
const root=createRoot(document.getElementById('visual-root')!);
Object.assign(window,{questionViews:questions,showQuestion:(i:number)=>root.render(<div style={{width:700,padding:20}}><h2>{questions[i].id}: {questions[i].answer}</h2><AnatomyQuestion key={questions[i].id} question={questions[i].anatomy!} checked={false} onAnswer={()=>{}}/></div>)});
(window as any).showQuestion(0);
