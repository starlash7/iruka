import type {Database} from '../db/index.ts';
import type {ProfileDto} from '../../src/shared/contracts.ts';
import {ApiError} from './errors.ts';
import {normalizePng} from '../media/png.ts';

export async function getProfile(db:Database,userId:string):Promise<ProfileDto>{
 const {rows}=await db.query<ProfileDto>('SELECT nickname,bio,avatar FROM user_profiles WHERE user_id=$1',[userId]);
 return rows[0]??{nickname:'Iruka 사용자',bio:'',avatar:null};
}
export function parseProfile(input:Record<string,unknown>):ProfileDto{
 if(Object.keys(input).some(key=>!['nickname','bio','avatar'].includes(key)))throw new ApiError('INVALID_REQUEST','프로필 항목을 확인해 주세요.');
 const {nickname,bio,avatar}=input;
 if(typeof nickname!=='string'||!nickname.trim()||nickname.length>30||typeof bio!=='string'||bio.length>300)
  throw new ApiError('INVALID_REQUEST','닉네임은 1~30자, 자기소개는 300자까지 입력할 수 있어요.');
 let image:string|null=null;
 if(avatar!==null){
  if(typeof avatar!=='string'||avatar.length>1500000||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar))throw new ApiError('INVALID_REQUEST','프로필 이미지를 다시 선택해 주세요.');
  const bytes=normalizePng(Buffer.from(avatar.slice(22),'base64'));
  if(bytes.readUInt32BE(16)>512||bytes.readUInt32BE(20)>512)throw new ApiError('INVALID_REQUEST','프로필 이미지는 512px 이하여야 해요.');
  image=`data:image/png;base64,${bytes.toString('base64')}`;
  if(image.length>1500000)throw new ApiError('INVALID_REQUEST','프로필 이미지가 너무 커요.');
 }
 return {nickname:nickname.trim(),bio:bio.trim(),avatar:image};
}
export async function saveProfile(db:Database,userId:string,input:Record<string,unknown>):Promise<ProfileDto>{
 const profile=parseProfile(input);
 await db.query(`INSERT INTO user_profiles(user_id,nickname,bio,avatar) VALUES($1,$2,$3,$4)
 ON CONFLICT(user_id) DO UPDATE SET nickname=EXCLUDED.nickname,bio=EXCLUDED.bio,avatar=EXCLUDED.avatar,updated_at=now()`,[userId,profile.nickname,profile.bio,profile.avatar]);
 return profile;
}
