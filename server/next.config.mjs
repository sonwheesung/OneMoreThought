/** @type {import('next').NextConfig} */
export default {
  // 앱(Expo)과 한 저장소에 있다. Next 가 상위로 올라가 크롤하지 않게 루트를 못박는다(조각 승계).
  outputFileTracingRoot: import.meta.dirname,
};
