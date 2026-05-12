const PERMISSIONS = {
  ID_CARD_MANAGE: 'id_card_manage',

  // Academic curricula and years (per-route)
  ACADEMIC_CURRICULA_LIST_READ: 'academic_curricula_list_read',
  ACADEMIC_CURRICULA_CREATE: 'academic_curricula_create',
  ACADEMIC_CURRICULA_ITEM_READ: 'academic_curricula_item_read',
  ACADEMIC_CURRICULA_ITEM_EDIT: 'academic_curricula_edit',
  ACADEMIC_CURRICULA_ITEM_DELETE: 'academic_curricula_delete',
  ACADEMIC_YEAR_OPTIONS_READ: 'academic_year_options_read',
  ACADEMIC_YEAR_NAMES_READ: 'academic_year_names_read',
  ACADEMIC_MEDIA_READ: 'academic_media_read',
  ACADEMIC_YEAR_ID_READ: 'academic_year_id_read',
  ACADEMIC_YEARS_LIST_READ: 'academic_years_list_read',
  ACADEMIC_YEAR_CREATE: 'academic_year_create',
  ACADEMIC_YEAR_ITEM_READ: 'academic_year_item_read',
  ACADEMIC_YEAR_ITEM_EDIT: 'academic_year_edit',
  ACADEMIC_YEAR_ITEM_DELETE: 'academic_year_delete',

  // Weekend policies (per-route)
  WEEKEND_POLICY_LIST_READ: 'weekend_policy_list_read',
  WEEKEND_POLICY_CREATE: 'weekend_policy_create',
  WEEKEND_POLICY_ITEM_READ: 'weekend_policy_item_read',
  WEEKEND_POLICY_DELETE: 'weekend_policy_delete',

  // Special working days (per-route)
  SPECIAL_WORKING_DAY_CREATE: 'special_working_day_create',
  SPECIAL_WORKING_DAY_LIST_READ: 'special_working_day_list_read',
  SPECIAL_WORKING_DAY_EDIT: 'special_working_day_edit',
  SPECIAL_WORKING_DAY_DELETE: 'special_working_day_delete',

  // Fee types (per-route)
  FEE_TYPE_CREATE: 'fee_type_create',
  FEE_TYPE_LIST_READ: 'fee_type_list_read',
  FEE_TYPE_EDIT: 'fee_type_edit',
  FEE_TYPE_DELETE: 'fee_type_delete',

  // Fee structures (per-route)
  FEE_STRUCTURE_CREATE: 'fee_structure_create',
  FEE_STRUCTURE_LIST_READ: 'fee_structure_list_read',
  FEE_STRUCTURE_ITEM_READ: 'fee_structure_item_read',
  FEE_STRUCTURE_EDIT: 'fee_structure_edit',
  FEE_STRUCTURE_DELETE: 'fee_structure_delete',

  // Fee dues and payments (per-route)
  FEE_DUES_GENERATE_CREATE: 'fee_dues_generate_create',
  FEE_STUDENT_DUES_READ: 'fee_student_dues_read',
  FEE_PAYMENTS_LIST_READ: 'fee_payments_list_read',
  FEE_PAYMENTS_COLLECT_CREATE: 'fee_payments_collect_create',

  // Attendance (per-route)
  ATTENDANCE_LIST_READ: 'attendance_list_read',
  ATTENDANCE_SAVE_CREATE: 'attendance_save_create',

  // Consolidated attendance (per-route)
  CONSOLIDATED_ATTENDANCE_DAILY_READ: 'consolidated_attendance_daily_read',
  MY_ATTENDANCE_READ: 'my_attendance_read',

  // Buildings (per-route)
  BUILDING_LIST_READ: 'building_list_read',
  BUILDING_ITEM_READ: 'building_item_read',
  BUILDING_CREATE: 'building_create',
  BUILDING_EDIT: 'building_edit',
  BUILDING_DELETE: 'building_delete',

  // Rooms (per-route)
  ROOM_TYPES_READ: 'room_types_read',
  ROOM_STATS_READ: 'room_stats_read',
  ROOM_BY_BUILDING_READ: 'room_by_building_read',
  ROOM_LIST_READ: 'room_list_read',
  ROOM_CREATE: 'room_create',
  ROOM_ITEM_READ: 'room_item_read',
  ROOM_EDIT: 'room_edit',
  ROOM_DELETE: 'room_delete',

  // Classes (per-route)
  CLASS_LIST_READ: 'class_list_read',
  CLASS_CREATE: 'class_create',
  CLASS_STATISTICS_READ: 'class_statistics_read',
  CLASS_BY_CAMPUS_READ: 'class_by_campus_read',
  CLASS_ITEM_READ: 'class_item_read',
  CLASS_EDIT: 'class_edit',
  CLASS_DELETE: 'class_delete',

  // Sections (per-route)
  SECTION_FILTER_OPTIONS_READ: 'section_filter_options_read',
  SECTION_STATISTICS_READ: 'section_statistics_read',
  SECTION_LIST_READ: 'section_list_read',
  SECTION_CREATE: 'section_create',
  SECTION_ITEM_READ: 'section_item_read',
  SECTION_SUBJECTS_READ: 'section_subjects_read',
  SECTION_EDIT: 'section_edit',
  SECTION_DELETE: 'section_delete',

  // Section subjects (per-route)
  SECTION_SUBJECT_ASSIGN_CREATE: 'section_subject_assign_create',
  SECTION_SUBJECT_LIST_READ: 'section_subject_list_read',
  SECTION_SUBJECT_UNASSIGN_CREATE: 'section_subject_unassign_create',

  // Subjects (per-route)
  SUBJECT_LIST_READ: 'subject_list_read',
  SUBJECT_CREATE: 'subject_create',
  SUBJECT_ITEM_READ: 'subject_item_read',
  SUBJECT_EDIT: 'subject_edit',
  SUBJECT_DELETE: 'subject_delete',

  // Tenants (per-route)
  TENANT_LIST_READ: 'tenant_list_read',
  TENANT_ITEM_READ: 'tenant_item_read',
  TENANT_EDIT: 'tenant_edit',
  TENANT_STATISTICS_READ: 'tenant_statistics_read',

  // Campuses (per-route)
  CAMPUS_LIST_READ: 'campus_list_read',
  CAMPUS_ITEM_READ: 'campus_item_read',
  CAMPUS_CREATE: 'campus_create',
  CAMPUS_UPDATE: 'campus_update',
  CAMPUS_DELETE: 'campus_delete',

  // Leave requests (per-route)
  LEAVE_CREATE: 'leave_create',
  LEAVE_MY_LIST_READ: 'leave_my_list_read',
  LEAVE_PENDING_LIST_READ: 'leave_pending_list_read',
  LEAVE_HISTORY_LIST_READ: 'leave_history_list_read',
  LEAVE_STATUS_EDIT: 'leave_status_edit',
  LEAVE_DELETE_ROUTE_DELETE: 'leave_delete_route_delete',
  LEAVE_CANCEL_EDIT: 'leave_cancel_edit',

  // Holidays (per-route)
  HOLIDAY_LIST_READ: 'holiday_list_read',
  HOLIDAY_CHECK_DATE_READ: 'holiday_check_date_read',
  HOLIDAY_CALCULATED_READ: 'holiday_calculated_read',
  HOLIDAY_CREATE: 'holiday_create',
  HOLIDAY_EDIT: 'holiday_edit',
  HOLIDAY_DELETE: 'holiday_delete',

  // Payroll (per-route)
  PAYROLL_REPORT_READ: 'payroll_report_read',
  MY_PAYROLL_READ: 'my_payroll_read',

  // Permissions management (per-route)
  ROLE_PERMISSION_CAMPUS_READ: 'role_permission_campus_read',
  ROLE_PERMISSION_CREATE: 'role_permission_create',
  ROLE_PERMISSION_DELETE: 'role_permission_delete',
  PERMISSION_LIST_READ: 'permission_list_read',
  PERMISSION_CREATE_ROUTE_CREATE: 'permission_create_route_create',
  PERMISSION_ITEM_READ: 'permission_item_read',
  PERMISSION_EDIT: 'permission_edit',
  PERMISSION_DELETE_ROUTE_DELETE: 'permission_delete_route_delete',

  // Users (per-route)
  USER_ROLES_READ: 'user_roles_read',
  USER_ATTENDANCE_SEARCH_READ: 'user_attendance_search_read',
  USER_ACTIVE_BY_ROLES_READ: 'user_active_by_roles_read',
  USER_ATTENDANCE_SAVE_CREATE: 'user_attendance_save_create',
  USER_ATTENDANCE_DAILY_READ: 'user_attendance_daily_read',
  USER_CREATE_ROUTE_CREATE: 'user_create_route_create',
  USER_STATUS_EDIT: 'user_status_edit',
  USER_EDIT: 'user_edit',
  USER_SEARCH_READ: 'user_search_read',
  USER_TEACHERS_SEARCH_READ: 'user_teachers_search_read',
  USER_STUDENTS_SEARCH_READ: 'user_students_search_read',
  USER_STUDENTS_BY_CLASS_SEARCH_READ: 'user_students_by_class_search_read',

  // Employees (per-route)
  EMPLOYEE_IMPORT_TEMPLATE_READ: 'employee_import_template_read',
  EMPLOYEE_IMPORT_CREATE: 'employee_import_create',
  EMPLOYEE_EXPORT_CREATE: 'employee_export_create',
  EMPLOYEE_BULK_UPDATE_CREATE: 'employee_bulk_update_create',
  EMPLOYEE_LIST_READ: 'employee_list_read',
  EMPLOYEE_CREATE_ROUTE_CREATE: 'employee_create_route_create',
  EMPLOYEE_STATISTICS_READ: 'employee_statistics_read',
  EMPLOYEE_ENUM_VALUES_READ: 'employee_enum_values_read',
  EMPLOYEE_FILTER_OPTIONS_READ: 'employee_filter_options_read',
  EMPLOYEE_CHECK_USERNAME_READ: 'employee_check_username_read',
  EMPLOYEE_CHECK_EMPLOYEE_ID_READ: 'employee_check_employee_id_read',
  EMPLOYEE_BY_CAMPUS_READ: 'employee_by_campus_read',
  EMPLOYEE_BY_DEPARTMENT_READ: 'employee_by_department_read',
  EMPLOYEE_BY_USERNAME_READ: 'employee_by_username_read',
  EMPLOYEE_FOR_EDIT_READ: 'employee_for_edit_read',
  EMPLOYEE_EDIT: 'employee_edit',
  EMPLOYEE_DELETE_ROUTE_DELETE: 'employee_delete_route_delete',

  // Students (per-route)
  STUDENT_IMPORT_TEMPLATE_READ: 'student_import_template_read',
  STUDENT_IMPORT_CREATE: 'student_import_create',
  STUDENT_EXPORT_CREATE: 'student_export_create',
  STUDENT_BULK_UPDATE_CREATE: 'student_bulk_update_create',
  STUDENT_LIST_READ: 'student_list_read',
  STUDENT_FILTER_OPTIONS_READ: 'student_filter_options_read',
  STUDENT_BY_FILTERS_READ: 'student_by_filters_read',
  STUDENT_ASSIGN_SECTION_CREATE: 'student_assign_section_create',
  STUDENT_SECTION_EDIT: 'student_section_edit',
  STUDENT_SECTION_DELETE: 'student_section_delete',
  STUDENT_CREATE_ROUTE_CREATE: 'student_create_route_create',
  STUDENT_STATISTICS_READ: 'student_statistics_read',
  STUDENT_BY_ADMISSION_READ: 'student_by_admission_read',
  STUDENT_BY_USERNAME_READ: 'student_by_username_read',
  STUDENT_FOR_EDIT_READ: 'student_for_edit_read',
  STUDENT_EDIT: 'student_edit',
  STUDENT_DELETE_ROUTE_DELETE: 'student_delete_route_delete',
  STUDENT_PARENTS_READ: 'student_parents_read',
  STUDENT_BY_PARENT_READ: 'student_by_parent_read',
  STUDENT_PARENT_ADD_CREATE: 'student_parent_add_create',
  STUDENT_PARENT_REMOVE_DELETE: 'student_parent_remove_delete',
  STUDENT_PARENT_RELATIONSHIP_EDIT: 'student_parent_relationship_edit',

  // Additional per-route permissions to ensure unique codes per route/method
  USER_ATTENDANCE_SEARCH_CREATE: 'user_attendance_search_create',
  USER_ACTIVE_BY_ROLES_CREATE: 'user_active_by_roles_create',
  USER_ATTENDANCE_DAILY_CREATE: 'user_attendance_daily_create',

  CONSOLIDATED_ATTENDANCE_DAILY_CREATE: 'consolidated_attendance_daily_create',

  EMPLOYEE_EDIT_PRIMARY_EDIT: 'employee_edit_primary_edit',
  EMPLOYEE_EDIT_USERNAME_EDIT: 'employee_edit_username_edit',
  EMPLOYEE_DELETE_USERNAME_ROUTE_DELETE: 'employee_delete_username_route_delete',
  EMPLOYEE_BY_EMPLOYEE_ID_READ: 'employee_by_employee_id_read',
  EMPLOYEE_BY_EMPLOYMENT_ID_READ: 'employee_by_employment_id_read',

  STUDENT_BY_SECTION_READ: 'student_by_section_read',

  // Auth (per-route)
  AUTH_PROFILE_READ: 'auth_profile_read',
  AUTH_CHANGE_PASSWORD_EDIT: 'auth_change_password_edit',

  // Exams (per-route)
  EXAM_CREATE: 'exam_create',
  EXAM_LIST_READ: 'exam_list_read',
  EXAM_ITEM_READ: 'exam_item_read',
  EXAM_EDIT: 'exam_edit',
  EXAM_DELETE: 'exam_delete',

  // Exam results (per-route)
  EXAM_RESULT_CREATE: 'exam_result_create',
  EXAM_RESULT_BULK_CREATE: 'exam_result_bulk_create',
  EXAM_RESULT_ITEM_READ: 'exam_result_item_read',
  EXAM_RESULT_EDIT: 'exam_result_edit',
  EXAM_RESULT_DELETE: 'exam_result_delete',
  EXAM_RESULT_BY_EXAM_READ: 'exam_result_by_exam_read',
  EXAM_RESULT_BY_STUDENT_READ: 'exam_result_by_student_read',

  SYLLABUS_BOOK_LIST_READ: 'syllabus_book_list_read',
  SYLLABUS_BOOK_CREATE: 'syllabus_book_create',
  SYLLABUS_BOOK_ITEM_READ: 'syllabus_book_item_read',
  SYLLABUS_BOOK_EDIT: 'syllabus_book_edit',
  SYLLABUS_BOOK_DELETE: 'syllabus_book_delete',

  SYLLABUS_CHAPTER_LIST_READ: 'syllabus_chapter_list_read',
  SYLLABUS_CHAPTER_CREATE: 'syllabus_chapter_create',
  SYLLABUS_CHAPTER_ITEM_READ: 'syllabus_chapter_item_read',
  SYLLABUS_CHAPTER_EDIT: 'syllabus_chapter_edit',
  SYLLABUS_CHAPTER_DELETE: 'syllabus_chapter_delete',

  SYLLABUS_TOPIC_LIST_READ: 'syllabus_topic_list_read',
  SYLLABUS_TOPIC_CREATE: 'syllabus_topic_create',
  SYLLABUS_TOPIC_ITEM_READ: 'syllabus_topic_item_read',
  SYLLABUS_TOPIC_EDIT: 'syllabus_topic_edit',
  SYLLABUS_TOPIC_DELETE: 'syllabus_topic_delete',

  SYLLABUS_SUBTOPIC_LIST_READ: 'syllabus_subtopic_list_read',
  SYLLABUS_SUBTOPIC_CREATE: 'syllabus_subtopic_create',
  SYLLABUS_SUBTOPIC_ITEM_READ: 'syllabus_subtopic_item_read',
  SYLLABUS_SUBTOPIC_EDIT: 'syllabus_subtopic_edit',
  SYLLABUS_SUBTOPIC_DELETE: 'syllabus_subtopic_delete',

  SYLLABUS_PLAN_LIST_READ: 'syllabus_plan_list_read',
  SYLLABUS_PLAN_CREATE: 'syllabus_plan_create',
  SYLLABUS_PLAN_ITEM_READ: 'syllabus_plan_item_read',
  SYLLABUS_PLAN_EDIT: 'syllabus_plan_edit',
  SYLLABUS_PLAN_DELETE: 'syllabus_plan_delete',

  SYLLABUS_PROGRESS_LIST_READ: 'syllabus_progress_list_read',
  SYLLABUS_PROGRESS_CREATE: 'syllabus_progress_create',
  SYLLABUS_PROGRESS_ITEM_READ: 'syllabus_progress_item_read',
  SYLLABUS_PROGRESS_EDIT: 'syllabus_progress_edit',
  SYLLABUS_PROGRESS_DELETE: 'syllabus_progress_delete',

  // Events (per-route)
  EVENT_CREATE: 'event_create',
  EVENT_LIST_READ: 'event_list_read',
  EVENT_EDIT: 'event_edit',
  EVENT_DELETE: 'event_delete'
};


module.exports = {
  PERMISSIONS
};
