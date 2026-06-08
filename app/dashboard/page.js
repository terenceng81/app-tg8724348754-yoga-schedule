import dynamic from 'next/dynamic'
const Page = dynamic(() => import('./_client'), { ssr: false, loading: () => <div className="spinner" /> })
export default Page
