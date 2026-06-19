import type { Provider, Service } from "~/types/service";

export interface FetchProvidersParams {
  serviceId: string;
  page: number;
  pageSize: number;
  search?: string;
}

export interface ProvidersPage {
  data: Provider[];
  hasNextPage: boolean;
}

export interface ServiceAdapter {
  fetchServices(): Promise<Service[]>;

  fetchProviders(params: FetchProvidersParams): Promise<ProvidersPage>;
}
