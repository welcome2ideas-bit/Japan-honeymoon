import type { TripData } from '../types';

// JSON owns travel content; storage only restores personal progress and Wishlist.
export function updateCatalog(saved:TripData,fresh:TripData):TripData {
 const retiredPurchaseTasks=['v24-task-3','v24-task-6'];
 const result:TripData={...fresh,catalogRevision:6,
  deletedTaskIds:saved.deletedTaskIds??[],officialTaskIds:fresh.tasks.map(t=>t.id),
  wishlist:saved.wishlist??fresh.wishlist,
  places:fresh.places.map(place=>{
   const previous=saved.places.find(p=>p.id===place.id);
   return previous?{...place,favorite:previous.favorite,status:previous.status,note:previous.note}:place;
  }),
  tasks:[...fresh.tasks.filter(t=>!saved.deletedTaskIds?.includes(t.id)).map(task=>{
   const previous=saved.tasks.find(t=>t.id===task.id);
   // Apply the confirmed Nara payment once, without resetting other personal states.
   if(task.id==='v24-task-2'&&(saved.catalogRevision??0)<6)return task;
   return previous?{...task,status:previous.status}:task;
  }),...saved.tasks.filter(t=>!fresh.tasks.some(f=>f.id===t.id)&&!saved.officialTaskIds?.includes(t.id)&&!saved.deletedTaskIds?.includes(t.id)&&!retiredPurchaseTasks.includes(t.id))],
  itinerary:fresh.itinerary.map(day=>({...day,activities:day.activities.map(activity=>{
   const previous=saved.itinerary.find(d=>d.id===day.id)?.activities.find(a=>a.id===activity.id);
   return previous?{...activity,completed:previous.completed}:activity;
  })}))
 };
 return JSON.stringify(result)===JSON.stringify(saved)?saved:result;
}
