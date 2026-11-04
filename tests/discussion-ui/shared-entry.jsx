import React, {useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import Discussion from '../../src/components/Discussion'
import {state} from './shared-backend.mjs'
import '../../src/styles.css'
function Fixture() {
 const [version,setVersion]=useState(0), memory=useRef({})
 return <main className="page-wrap detail-page"><div className="fixture-controls">
 <button onClick={()=>{state.failPosts=true}}>模拟帖子读取失败</button><button onClick={()=>{state.failReplies=true}}>模拟回复读取失败</button><button onClick={()=>{state.failPosts=false;state.failReplies=false}}>允许读取</button><button onClick={()=>setVersion(v=>v+1)}>模拟有新内容</button>
 </div><Discussion locationId="test" community={{posts:[],feedback:[],discussionVersion:version}} shared user={{id:'fixture',name:'本地司机'}} onAction={async()=>false} showToast={()=>{}} onLogin={()=>{}} entry="discussion" memory={memory} /></main>
}
createRoot(document.getElementById('root')).render(<Fixture/> )
