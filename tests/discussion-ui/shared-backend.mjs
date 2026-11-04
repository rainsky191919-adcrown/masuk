import { localPostPage, localReplyPage } from '../../src/lib/discussions.js'
export const canModerate = () => false
export const state={failPosts:false,failReplies:false,calls:[],posts:Array.from({length:21},(_,i)=>({id:`post-${i}`,locationId:'test',type:i%2?'经验分享':'提问',title:`共享夹具帖子 ${i+1}`,body:'仅本地测试',author:'本地司机',authorId:'fixture',createdAt:new Date(2026,0,1,0,i).toISOString(),activityAt:new Date(2026,0,1,0,i).toISOString(),helpful:[],reports:[],pinned:false,replies:Array.from({length:11},(_,j)=>({id:`reply-${i}-${j}`,author:'本地司机',authorId:'fixture',body:`隔离回复 ${j+1}`,createdAt:new Date(2026,0,2,0,j).toISOString()}))}))}
export async function discussionCommand(action,payload) {
 state.calls.push({action,...payload})
 if(action==='posts') {
   if(state.failPosts) throw new Error('isolated read failure')
   const page=localPostPage({posts:state.posts},payload.locationId,payload.type,payload.sort,payload.page,payload.focusId)
   return {...page,items:page.items.map(({replies,...p})=>p)}
 }
 if(state.failReplies) throw new Error('isolated read failure')
 return localReplyPage(state.posts.find(p=>p.id===payload.postId),payload.page)
}
