export async function prepareAvatar(file:File):Promise<string>{
 if(file.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('5MB 이하의 PNG, JPG, WebP 이미지를 선택해 주세요.');
 let bitmap:ImageBitmap;
 try{bitmap=await createImageBitmap(file);}catch{throw new Error('이미지를 읽을 수 없어요.');}
 try{
  if(bitmap.width>4096||bitmap.height>4096)throw new Error('4096px 이하의 이미지를 선택해 주세요.');
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const context=canvas.getContext('2d');if(!context)throw new Error('이미지를 준비하지 못했어요.');
  const size=Math.min(bitmap.width,bitmap.height);
  context.drawImage(bitmap,(bitmap.width-size)/2,(bitmap.height-size)/2,size,size,0,0,512,512);
  const avatar=canvas.toDataURL('image/png');
  if(avatar.length>1500000)throw new Error('이미지가 너무 커요. 다른 이미지를 선택해 주세요.');
  return avatar;
 }finally{bitmap.close();}
}
