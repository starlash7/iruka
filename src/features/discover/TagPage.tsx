import type {RoutePageProps} from '../../routes/paths';
import {ReaderLayout} from './ReaderLayout';
import {SearchResults} from './SearchPage';
export default function TagPage({params}:RoutePageProps){return <ReaderLayout><div className="reader-content"><h1>#{params.tag}</h1><SearchResults tag={params.tag}/></div></ReaderLayout>;}
