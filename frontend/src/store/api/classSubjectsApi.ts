import { baseApi } from './baseApi';
import { ApiResponse } from '@/types';

interface ClassSubject {
  _id: string;
  class: {
    _id: string;
    name: string;
    grade: number;
  };
  subject: {
    _id: string;
    name: string;
    code: string;
    category: string;
  };
  teacher: string;
  academicYear: string;
  termNumber: number;
  maxMarks: {
    cat1: number;
    cat2: number;
    endterm: number;
  };
  status: string;
}

interface ClassSubjectStudent {
  _id: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  admissionNumber: string;
  currentClass?: {
    _id: string;
    name: string;
  };
}

export const classSubjectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Teacher subjects
    getTeacherSubjects: builder.query<
      ApiResponse<any[]>,
      { teacherId: string; academicYear?: string }
    >({
      query: ({ teacherId, academicYear }) => ({
        url: `/teacher/subjects/${teacherId}`,
        params: { academicYear },
      }),
      providesTags: ['ClassSubject'],
    }),
    
    // Get all class subjects
    getMyClassSubjects: builder.query<
      ApiResponse<{ classSubjects: ClassSubject[]; count: number }>,
      { academicYear?: string; termNumber?: number }
    >({
      query: (params) => ({
        url: '/class-subjects/me',
        params,
      }),
      providesTags: ['ClassSubject'],
    }),
    
    // Get students enrolled in a specific class-subject
    getStudentsInClassSubject: builder.query<
      ApiResponse<{ students: ClassSubjectStudent[]; count: number }>,
      { classSubjectId: string; academicYear: string }
    >({
      query: ({ classSubjectId, academicYear }) => ({
        url: `/class-subjects/${classSubjectId}/students`,
        params: { academicYear },
      }),
      providesTags: (result, error, { classSubjectId }) => [
        { type: 'Student', id: classSubjectId }
      ],
    }),
    
    // Alternative endpoint name for getting students in a class subject
    getStudentsInSubject: builder.query<
      ApiResponse<{ students: ClassSubjectStudent[]; count: number }>,
      { classSubjectId: string; academicYear: string }
    >({
      query: ({ classSubjectId, academicYear }) => ({
        url: `/class-subjects/${classSubjectId}/students`,
        params: { academicYear },
      }),
      providesTags: (result, error, { classSubjectId }) => [
        { type: 'Student', id: classSubjectId }
      ],
    }),
    
    // Get all available academic terms 
    getTerms: builder.query<
      ApiResponse<{ terms: Array<{ termNumber: number; name: string; academicYear: string; _id: string }> }>,
      void
    >({
      query: () => '/academic/terms',
      providesTags: ['AcademicTerm'],
    }),
    
  }),
  overrideExisting: false,
});

export const {
  useGetTeacherSubjectsQuery,
  useGetMyClassSubjectsQuery,
  useGetStudentsInClassSubjectQuery,
  useGetStudentsInSubjectQuery,
  useGetTermsQuery,
} = classSubjectsApi;
