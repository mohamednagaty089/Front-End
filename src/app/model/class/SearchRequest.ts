export class SearchRequest {
  page: number|undefined;
  size: number|undefined;
  searchValue: string|undefined;
  sortDirection: string|undefined;

  constructor(data?: Partial<SearchRequest>) {
    this.page = data?.page ?? undefined;
    this.size = data?.size ?? undefined;
    this.searchValue = data?.searchValue ?? undefined;
    this.sortDirection = data?.sortDirection ?? undefined;
  } 
  
}