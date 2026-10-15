/** Decode locally and send a single metadata-free PNG frame. The server validates again. */
export async function prepareImage(file:File):Promise<Blob> {
 if(file.size>5*1024*1024)throw new Error('이미지는 5MB 이하로 선택해 주세요.');
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('PNG, JPEG, WebP 이미지를 선택해 주세요.');
 let bitmap:ImageBitmap;
 try{bitmap=await createImageBitmap(file);}catch{throw new Error('이미지 파일을 읽을 수 없어요. 다른 파일을 선택해 주세요.');}
 try {
  if(bitmap.width>4096||bitmap.height>4096||bitmap.width*bitmap.height>12000000)throw new Error('4096×4096, 1,200만 화소 이하 이미지를 선택해 주세요.');
  const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
  const context=canvas.getContext('2d');if(!context)throw new Error('이미지를 준비할 수 없어요.');context.drawImage(bitmap,0,0);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('이미지 변환에 실패했어요.')),'image/png'));
  if(blob.size>5*1024*1024)throw new Error('변환된 이미지가 5MB를 넘어요. 작은 이미지를 선택해 주세요.');return blob;
 }finally{bitmap.close();}
}
