import { get, post, del } from '../client';
import { AnnotationApi } from '../constants';

export interface AnnotationInfo {
  id: number;
  name: string;        // 如 "server/env"
  value: string;       // 如 "prod"
  namespace?: string;  // 如 "server"
  key: string;         // 如 "env"
  createdAt: string;
  updatedAt: string;
  hostCount?: number;  // 关联的主机数量
}

export interface AnnotationListResponse {
  count: number;
  list: AnnotationInfo[];
}

/**
 * 主机管理下的注解管理
 */
const annotationService = {
  /** 获取注解列表 */
  getAnnotationList() {
    return get<AnnotationListResponse>(AnnotationApi.List);
  },

  /** 分配注解 */
  assignAnnotation(params: { hostId: number; annotationIds: number[] }) {
    return post<void>(AnnotationApi.AssignToHost, params);
  },

  /** 删除注解 */
  deleteAnnotation(annotationId: number) {
    return del<void>(AnnotationApi.ById.replace(':id', annotationId.toString()));
  },

  /** 创建注解 */
  createAnnotation(params: { name: string; value: string }) {
    return post<void>(AnnotationApi.Create, params);
  },

  /** 解绑主机注解 */
  unbindHostsAnnotation(params: { annotationId: number }) {
    return post<void>(AnnotationApi.UnbindFromHost.replace(':id', params.annotationId.toString()));
  },

  /** 搜索注解 */
  searchAnnotations(params: { q: string; limit?: number }) {
    return get<AnnotationInfo[]>(AnnotationApi.Search, { params });
  },
};

export default annotationService;
