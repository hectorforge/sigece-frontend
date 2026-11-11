import { CategoriaSiseve, Gravedad } from './enums';

export interface TipoIncidenciaRequest {
  nombre: string;
  categoriaSiseve: CategoriaSiseve;
  gravedadBase: Gravedad;
  descripcion?: string | null;
}

export interface TipoIncidenciaResponse {
  id: number;
  nombre: string;
  categoriaSiseve: CategoriaSiseve;
  gravedadBase: Gravedad;
  descripcion?: string | null;
  activo: boolean;
}

export type TipoIncidencia = TipoIncidenciaResponse;

export interface TipoIncidenciaFiltroRequest {
  termino?: string | null;
  categoriaSiseve?: CategoriaSiseve | null;
  gravedadBase?: Gravedad | null;
  page?: number;
  size?: number;
}