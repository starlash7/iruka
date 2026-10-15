import type {PublicWorkDetailDto} from '../../../shared/contracts';
// Original fictional QA works. Never imported by the production entry.
const stories=[
 ['별을 맡아 드립니다','자정에 문을 여는 천문대. 잃어버린 별 하나가 당신의 이름을 부른다.','판타지','밤하늘','서하'],
 ['비가 그치면, 서점에서','골목 끝 작은 서점에서 시작되는 느긋한 일상과 오래된 편지.','일상','서점','윤슬'],
 ['마지막 정거장의 안내인','노선도에 없는 역에 도착했다. 돌아갈 열차는 아직 오지 않았다.','미스터리','여행','이온'],
 ['우리의 여름 기록','잊고 지낸 해변 마을. 파도 소리와 함께 새로운 이야기가 열린다.','청춘','일상','하루'],
 ['구름 위의 정원사','하늘 정원의 계절을 돌보는 당신에게 작은 씨앗 하나가 도착한다.','판타지','힐링','소라'],
 ['오후 세 시의 우체국','배달되지 못한 편지가 모이는 곳. 오늘의 수신인은 바로 당신.','일상','힐링','다온'],
 ['느린 궤도의 여행자','우주 정거장에서 만난 동료와 함께, 낯선 행성으로 향한다.','SF','모험','라온'],
 ['달의 뒷면을 걷는 밤','지도 밖의 도시에서 당신은 기억을 찾는 안내자와 만난다.','판타지','미스터리','해솔'],
 ['숲을 읽는 사람','나무의 나이테에는 지나간 이야기가 남는다. 오늘은 어떤 기억을 읽을까.','힐링','모험','여울'],
 ['작은 카페의 내일','빈 가게를 함께 채워 가는 두 사람. 첫 손님을 맞을 준비가 되었나요.','일상','성장','유하'],
];
export const fixtureWorks:PublicWorkDetailDto[]=stories.map(([title,description,genre,tag,name],index)=>({
 id:`work-${index+1}`,creatorId:'fixture-author',mode:index%3===1?'character':'story',title,description,
 coverUrl:`/src/features/discover/__fixtures__/cover-${index%5}.svg`,tags:[genre,tag],publishedVersionId:`version-${index+1}`,createdAt:'2026-10-14T00:00:00Z',
 snapshot:{tagline:description.split('.')[0],playGuide:'행동이나 대사를 자유롭게 입력해 이야기를 이어가세요.',characters:[{id:`character-${index}`,name,imageUrl:null}],openings:[
 {id:'first',title:'처음 만나는 날',prologue:'문을 열자 낯선 풍경이 펼쳐진다. 누군가 당신을 기다리고 있다.',firstMessage:`@${name}@ 기다리고 있었어요. 오늘은 어떤 이야기를 들려주실 건가요?`,suggestedReplies:['주변을 천천히 둘러본다.','당신은 누구인가요?']},
 {id:'return',title:'다시 찾아온 저녁',prologue:'익숙한 문 앞에 다시 섰다. 그날 미처 하지 못했던 말이 떠오른다.',firstMessage:`@${name}@ 다시 와 주셨네요. 들어오세요.`,suggestedReplies:['잘 지냈나요?']},
 ]},
}));
