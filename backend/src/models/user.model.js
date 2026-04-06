const {pool} = require('../config/database');
const logger = require('../utils/logger');

/**
 * User Model: Handles database interactions for the `users` table.
 */
const UserModel = {
    async findByUsername(username, client = pool) {
        try {
            if (!client || typeof client.query !== 'function') {
                throw new Error('Invalid database client provided:', client);
            }

            const query = 'SELECT * FROM users WHERE username = $1';
            const result = await client.query(query, [username]);
            // Return the user object if found, otherwise return false.
            return result.rows[0] || false;
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw new Error('Failed to find user by username. ', username);
        }
    },

    async findTenantsAndUsersByMobile(mobileNumber, client = pool) {
        try {
            const query = `
                SELECT 
                    t.tenant_id,
                    t.tenant_name,
                    t.subdomain,
                    u.username,
                    u.first_name,
                    u.last_name,
                    u.role,
                    u.user_id
                FROM users u
                JOIN tenants t ON u.tenant_id = t.tenant_id
                WHERE u.phone_number = $1
                ORDER BY t.tenant_name, u.username
            `;
            const result = await client.query(query, [mobileNumber]);
            return result.rows;
        } catch (error) {
            console.error('Error finding tenants and users by mobile:', error);
            throw new Error('Failed to resolve tenants by mobile number.');
        }
    },

    async create(user, tenant_id,client = pool) {
        try {
            const query = `
                INSERT INTO users (username, first_name, middle_name, last_name, phone_number, password_hash, date_of_birth, role, tenant_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *;
            `;
            const values = [
                user.username,
                user.first_name,
                user.middle_name,
                user.last_name,
                user.phone_number,
                user.password_hash,
                user.date_of_birth,
                user.role,
                tenant_id
            ];
            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating user:', error);
            throw new Error('Failed to create user.');
        }
    },

    async createUserStatus(username, campusId, tenantId, client = pool) {
        try {
            const query = `
                INSERT INTO user_statuses (username, campus_id, tenant_id, status)
                VALUES ($1, $2, $3, $4)
            `;
            const values = [username, campusId, tenantId, 'active'];
            await client.query(query, values);
        } catch (error) {
            console.error('Error creating user status:', error);
            throw new Error(`Failed to create user status: ${error.message}`);
        }
    },

    async setUserStatus(username, campusId, status, client = pool) {
        try {
            const query = `
                UPDATE user_statuses
                SET status = $1, updated_at = NOW()
                WHERE username = $2 AND campus_id = $3
            `;
            const values = [status, username, campusId];
            await client.query(query, values);
        } catch (error) {
            console.error('Error setting user status:', error);
            throw new Error('Failed to set user status.');
        }
    },

    async editUser(username, updates, client = pool) {
        try {
            const fields = [];
            const values = [];
            let index = 1;

            for (const [key, value] of Object.entries(updates)) {
                fields.push(`${key} = $${index}`);
                values.push(value);
                index++;
            }

            const query = `
                UPDATE users
                SET ${fields.join(', ')}, updated_at = NOW()
                WHERE username = $${index}
                RETURNING *;
            `;
            values.push(username);

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error editing user:', error);
            throw new Error('Failed to edit user.');
        }
    },
   
    async isUserMemberOfTenant (username, tenantId, client = pool) {
    const query = `
        SELECT 1
        FROM users
        WHERE username = $1 AND tenant_id = $2
    `;
    
    try {
        const result = await client.query(query, [username, tenantId]);
        return result.rows.length > 0;
    } catch (error) {
        throw error;
    }
    },

    async getDistinctRoles(tenantId, campusId, client = pool) {
        try {
            let query;
            let values;
            
            if (campusId) {
                query = `
                    SELECT DISTINCT u.role 
                    FROM users u
                    JOIN user_statuses us ON u.username = us.username
                    WHERE u.tenant_id = $1 AND us.campus_id = $2
                    ORDER BY u.role
                `;
                values = [tenantId, campusId];
            } else {
                query = `
                    SELECT DISTINCT role 
                    FROM users 
                    WHERE tenant_id = $1
                    ORDER BY role
                `;
                values = [tenantId];
            }
            
            const result = await client.query(query, values);
            return result.rows.map(row => row.role);
        } catch (error) {
            console.error('Error fetching distinct roles:', error);
            throw new Error('Failed to fetch distinct roles.');
        }
    },

    /**
     * Get users for attendance based on roles and optional academic year (for students)
     */
    async getUsersForAttendance(campusId, roles, academicYear, tenantId, client = pool) {
        try {
            // Base query to fetch users with their status and basic info
            let query = `
                SELECT DISTINCT u.user_id, u.username, u.first_name, u.last_name, u.role, us.status,
                       se.roll_number, se.class_name, se.section_id
                FROM users u
                JOIN user_statuses us ON u.username = us.username
                LEFT JOIN student_enrollment se ON u.username = se.username
                LEFT JOIN academic_years ay ON se.academic_year_id = ay.academic_year_id
                WHERE us.campus_id = $1 
                AND u.tenant_id = $2
                AND us.status = 'active'
            `;
            
            const values = [campusId, tenantId];
            let paramIndex = 3;

            // Filter by roles
            if (roles && roles.length > 0) {
                query += ` AND u.role = ANY($${paramIndex})`;
                values.push(roles);
                paramIndex++;
            }

            // For students, filter by academic year if provided
            // We use a complex condition: 
            // - If user is NOT a student, they are included (since we filtered by role already)
            // - If user IS a student, they must match the academic year (via name)
            if (academicYear) {
                query += ` AND (
                    u.role != 'Student' 
                    OR (u.role = 'Student' AND ay.year_name = $${paramIndex})
                )`;
                values.push(academicYear);
                paramIndex++;
            }

            query += ` ORDER BY u.role, u.first_name, u.last_name`;

            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error fetching users for attendance:', error);
            throw new Error('Failed to fetch users for attendance.');
        }
    },

    /**
     * Get active users for given roles within a campus
     */
    async getActiveUsersOfRoles(campusId, roles, tenantId, client = pool) {
        try {
            let query = `
                SELECT u.user_id, u.username, u.first_name, u.last_name, u.role
                FROM users u
                INNER JOIN user_statuses us ON us.username = u.username
                WHERE us.campus_id = $1
                AND u.tenant_id = $2
                AND us.status = 'active'
            `;
            const values = [campusId, tenantId];
            let paramIndex = 3;

            if (roles && Array.isArray(roles) && roles.length > 0) {
                query += ` AND u.role = ANY($${paramIndex})`;
                values.push(roles);
                paramIndex++;
            }

            query += ` ORDER BY u.role, u.first_name, u.last_name`;

            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error fetching active users by roles:', error);
            throw new Error('Failed to fetch active users by roles.');
        }
    },

    /**
     * Get active users for given roles and include attendance status for a specific date and (optional) academic year
     */
    async getActiveUsersOfRolesWithAttendance(campusId, roles, tenantId, attendanceDate, yearName = null, classId = null, sectionId = null, client = pool) {
        try {
            const values = [campusId, tenantId];
            let paramIndex = 3;

            let joinClause = `
                LEFT JOIN user_attendance ua
                    ON ua.username = u.username
                    AND ua.campus_id = us.campus_id
                    AND ua.attendance_date = $${paramIndex}
            `;
            values.push(attendanceDate);
            paramIndex++;

            if (yearName) {
                joinClause += ` AND ua.year_name = $${paramIndex}`;
                values.push(yearName);
                paramIndex++;
            }

            if (classId || sectionId) {
                joinClause += `
                    LEFT JOIN student_enrollment se ON u.username = se.username
                    LEFT JOIN classes c ON se.class_id = c.class_id
                `;
            }

            let query = `
                SELECT u.user_id, u.username, u.first_name, u.last_name, u.role,
                       ua.status AS attendance_status,
                       ua.duration AS attendance_duration,
                       ua.total_duration AS attendance_total_duration,
                       ua.login_time,
                       ua.logout_time,
                       EXTRACT(EPOCH FROM ua.duration) / 60.0 AS attendance_duration_minutes,
                       EXTRACT(EPOCH FROM ua.total_duration) / 60.0 AS attendance_total_duration_minutes
                FROM users u
                INNER JOIN user_statuses us ON us.username = u.username
                ${joinClause}
                WHERE us.campus_id = $1
                AND u.tenant_id = $2
                AND us.status = 'active'
            `;

            if (roles && Array.isArray(roles) && roles.length > 0) {
                query += ` AND u.role = ANY($${paramIndex})`;
                values.push(roles);
                paramIndex++;
            }

            if (classId) {
                query += ` AND c.class_id = $${paramIndex}`;
                values.push(classId);
                paramIndex++;
            }

            if (sectionId) {
                query += ` AND se.section_id = $${paramIndex}`;
                values.push(sectionId);
                paramIndex++;
            }

            query += ` ORDER BY u.role, u.first_name, u.last_name`;

            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error fetching active users with attendance:', error);
            throw new Error('Failed to fetch active users with attendance.');
        }
    },
    
    async getActiveUsersWithAcademicFilters(tenantId, campusId, roles, { yearName = null, classId = null, sectionId = null } = {}, client = pool) {
        try {
            let query = `
                SELECT DISTINCT
                    u.user_id, u.username, u.first_name, u.last_name, u.role,
                    se.academic_year_id as student_ay_id
                FROM users u
                JOIN user_statuses us ON u.username = us.username
                LEFT JOIN student_enrollment se ON u.username = se.username
                LEFT JOIN classes c ON se.class_id = c.class_id
                LEFT JOIN academic_years ay ON se.academic_year_id = ay.academic_year_id
                WHERE u.tenant_id = $1 AND us.campus_id = $2 AND us.status = 'active'
            `;
            const values = [tenantId, campusId];
            let pIdx = 3;
            if (roles && Array.isArray(roles) && roles.length > 0) {
                query += ` AND u.role = ANY($${pIdx})`;
                values.push(roles);
                pIdx++;
            }
            if (yearName) {
                query += ` AND (u.role != 'Student' OR ay.year_name = $${pIdx})`;
                values.push(yearName);
                pIdx++;
            }
            if (classId) {
                query += ` AND (u.role != 'Student' OR c.class_id = $${pIdx})`;
                values.push(classId);
                pIdx++;
            }
            if (sectionId) {
                query += ` AND (u.role != 'Student' OR se.section_id = $${pIdx})`;
                values.push(sectionId);
            }
            const res = await client.query(query, values);
            return res.rows;
        } catch (error) {
            console.error('Error fetching users with academic filters:', error);
            throw new Error('Failed to fetch users with academic filters.');
        }
    },
    
    async saveUserAttendance(attendanceDate, yearName, campusId, records, client = pool) {
        try {
            if (!records || !Array.isArray(records) || records.length === 0) {
                logger && logger.info && logger.info('UserModel.saveUserAttendance: No records to save');
                return { savedCount: 0 };
            }
            const values = [];
            let idx = 1;
            const placeholders = records.map(r => {
                // Expected r: { username, role, status, duration, total_duration, login_time, logout_time }
                values.push(
                    campusId, 
                    yearName, 
                    r.username, 
                    r.role, 
                    attendanceDate, 
                    r.status, 
                    r.duration ?? null, 
                    r.total_duration ?? null,
                    r.login_time ?? null,
                    r.logout_time ?? null
                );
                const ph = `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8}, $${idx + 9})`;
                idx += 10;
                return ph;
            }).join(', ');
            const query = `
                INSERT INTO user_attendance (
                    campus_id, year_name, username, role, attendance_date, 
                    status, duration, total_duration, login_time, logout_time
                )
                VALUES ${placeholders}
                ON CONFLICT (username, attendance_date)
                DO UPDATE SET 
                    campus_id = EXCLUDED.campus_id,
                    year_name = EXCLUDED.year_name,
                    role = EXCLUDED.role,
                    status = EXCLUDED.status,
                    duration = EXCLUDED.duration,
                    total_duration = EXCLUDED.total_duration,
                    login_time = EXCLUDED.login_time,
                    logout_time = EXCLUDED.logout_time
            `;
            await client.query(query, values);
            return { savedCount: records.length };
        } catch (error) {
            console.error('Error saving user attendance:', error);
            throw new Error('Failed to save user attendance.');
        }
    },

    /**
     * Upsert a single user attendance record.
     * Used for real-time sync from event attendance.
     */
    async upsertSingleUserAttendance(client, { campusId, yearName, username, role, attendanceDate, status, duration, totalDuration, loginTime, logoutTime }) {
        const query = `
            INSERT INTO user_attendance (
                campus_id, year_name, username, role, 
                attendance_date, status, duration, total_duration,
                login_time, logout_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $7::interval, $8::interval, $9, $10)
            ON CONFLICT (username, attendance_date) 
            DO UPDATE SET 
                campus_id = EXCLUDED.campus_id,
                role = EXCLUDED.role,
                status = EXCLUDED.status,
                duration = EXCLUDED.duration,
                total_duration = EXCLUDED.total_duration,
                login_time = EXCLUDED.login_time,
                logout_time = EXCLUDED.logout_time
        `;

        try {
            await client.query(query, [
                campusId,
                yearName,
                username,
                role,
                attendanceDate,
                status,
                duration,
                totalDuration,
                loginTime || null,
                logoutTime || null
            ]);
        } catch (error) {
            console.error('Error in upsertSingleUserAttendance:', error);
            throw error; // Propagate error to ensure transaction rollback
        }
    },

    async getUserRoleForTenant (username, tenantId, client = pool) {
        const query = `
            SELECT role 
            FROM users 
            WHERE username = $1 AND tenant_id = $2
        `;
        
        try {
            const result = await client.query(query, [username, tenantId]);
            return result.rows[0] ? result.rows[0].role : null;
        } catch (error) {
            throw error;
        }
    },

    async getUserCampusId(username, tenantId, client = pool) {
        const query = `
            SELECT campus_id 
            FROM user_statuses 
            WHERE username = $1 AND tenant_id = $2
        `;
        
        try {
            const result = await client.query(query, [username, tenantId]);
            return result.rows[0] ? result.rows[0].campus_id : null;
        } catch (error) {
            throw error;
        }
    },

    async getUserStatus(username, campusId, client = pool) {
        const query = `
            SELECT status 
            FROM user_statuses 
            WHERE username = $1 AND campus_id = $2
        `;

        try {
            const result = await client.query(query, [username, campusId]);
            return result.rows[0] ? result.rows[0].status : null;
        } catch (error) {
            console.error('Error getting user status:', error);
            throw new Error('Failed to get user status.');
        }
    },

    /**
     * Search users by name and optional role filter
     */
    async searchUsers(searchTerm, role, tenantId, campusId, client = pool) {
        try {
            let query = `
                SELECT u.username, u.first_name, u.middle_name, u.last_name, u.role, us.status
                FROM users u
                LEFT JOIN user_statuses us ON u.username = us.username
                WHERE u.tenant_id = $1 
                AND us.campus_id = $2
                AND (u.first_name ILIKE $3 OR u.last_name ILIKE $3 OR u.username ILIKE $3)
            `;
            
            const values = [tenantId, campusId, `%${searchTerm}%`];
            
            if (role) {
                query += ` AND u.role = $4`;
                values.push(role);
            }
            
            query += ` ORDER BY u.first_name, u.last_name LIMIT 20`;
            
            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error searching users:', error);
            throw new Error('Failed to search users.');
        }
    },

    /**
     * Search teachers with academic filters
     */
    async searchTeachers(searchTerm, filters, tenantId, client = pool) {
        try {
            let query = `
                SELECT DISTINCT u.username, u.first_name, u.middle_name, u.last_name, u.role
                FROM users u
                LEFT JOIN user_statuses us ON u.username = us.username
            `;
            
            const conditions = [`u.tenant_id = $1`, `u.role = 'Teacher'`];
            const values = [tenantId];
            let paramIndex = 2;
            
            // Add search term condition
            conditions.push(`(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`);
            values.push(`%${searchTerm}%`);
            paramIndex++;
            
            // Add campus filter - teachers must have status in the specified campus
            if (filters.campusId) {
                conditions.push(`us.campus_id = $${paramIndex}`);
                values.push(filters.campusId);
                paramIndex++;
            }
            
            // For teachers, we can filter by sections they might be assigned to
            if (filters.classId || filters.curriculumId || filters.academicYearId) {
                query += `
                    LEFT JOIN class_sections cs ON (cs.primary_teacher_user_id = u.user_id)
                `;
                
                if (filters.academicYearId) {
                    conditions.push(`cs.academic_year_id = $${paramIndex}`);
                    values.push(filters.academicYearId);
                    paramIndex++;
                }
                
                if (filters.classId) {
                    conditions.push(`cs.class_id = $${paramIndex}`);
                    values.push(filters.classId);
                    paramIndex++;
                }
                
                if (filters.curriculumId) {
                    conditions.push(`cs.curriculum_id = $${paramIndex}`);
                    values.push(filters.curriculumId);
                    paramIndex++;
                }
            }
            
            query += ` WHERE ` + conditions.join(' AND ');
            query += ` ORDER BY u.first_name, u.last_name LIMIT 20`;
            
            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error searching teachers:', error);
            throw new Error('Failed to search teachers.');
        }
    },

    /**
     * Search students with academic filters
     */
    async searchStudents(searchTerm, filters, tenantId, client = pool) {
        try {

            let query = `
                SELECT DISTINCT u.user_id, u.username, u.first_name, u.middle_name, u.last_name, u.role,
                       se.admission_number, se.roll_number
                FROM users u
                INNER JOIN user_statuses us ON u.username = us.username
                INNER JOIN student_enrollment se ON u.username = se.username
                INNER JOIN classes c ON se.class_id = c.class_id
                INNER JOIN curricula cu ON c.campus_id = cu.campus_id 
            `;
            
            const conditions = [`u.role = 'Student'`];
            const values = [];
            let paramIndex = 1;
            
            // Add search term condition
            conditions.push(
                
                    `((u.first_name || ' ' || u.last_name) ILIKE $${paramIndex}
                    OR (u.first_name || ' ' || u.middle_name || ' ' || u.last_name) ILIKE $${paramIndex}
                    OR u.username ILIKE $${paramIndex})`
                );
            values.push(`%${searchTerm}%`);
            paramIndex++;
            
            // Add campus filter (required with INNER JOIN)
            if (filters.campusId) {
                console.log('🏫 Adding campus filter:', filters.campusId);
                conditions.push(`us.campus_id = $${paramIndex}`);
                values.push(filters.campusId);
                paramIndex++;
            }
            
            // Add academic year filter (required with INNER JOIN)
            if (filters.academicYearId) {
                console.log('📅 Academic Year ID:', filters.academicYearId);
                conditions.push(`se.academic_year_id = $${paramIndex}`);
                values.push(filters.academicYearId);
                paramIndex++;
            }
            
            // Add class filter (required with INNER JOIN)
            if (filters.classId) {
                console.log('🎓 Class ID:', filters.classId);
                conditions.push(`c.class_id = $${paramIndex}`);
                values.push(filters.classId);
                paramIndex++;
            }
            
            // Add curriculum filter (required with INNER JOIN)
            if (filters.curriculumId) {
                console.log('📖 Curriculum ID:', filters.curriculumId);
                conditions.push(`cu.curriculum_id = $${paramIndex}`);
                values.push(filters.curriculumId);
                paramIndex++;
            }
            
            query += ` WHERE ` + conditions.join(' AND ');
            query += ` AND us.status = 'active'`; // Only show active students
            query += ` ORDER BY u.first_name, u.last_name LIMIT 20`;
            
            // Log the complete query details
            console.log('\n📋 FINAL QUERY DETAILS:');
            console.log('🔧 SQL Query:');
            console.log(query);
            console.log('\n📦 Parameters:', values);
            console.log('🔢 Parameter Count:', values.length);
            
            // Use project logger as well
            logger.info('Executing student search query', {
                searchTerm,
                filters,
                tenantId,
                queryParamCount: values.length,
                conditions: conditions.length
            });
            
            console.log('\n⚡ Executing query...');
            const startTime = Date.now();
            const result = await client.query(query, values);
            const executionTime = Date.now() - startTime;
            
            console.log('✅ Query executed successfully!');
            console.log('⏱️ Execution time:', executionTime + 'ms');
            console.log('📊 Results found:', result.rows.length);
            console.log('👥 First few results:', result.rows.slice(0, 2));
            console.log('🔍 ========== STUDENT SEARCH DEBUG END ==========\n');
            
            // Log results with project logger
            logger.info('Student search completed', {
                resultsCount: result.rows.length,
                executionTime: executionTime + 'ms',
                searchTerm,
                tenantId
            });
            
            return result.rows;
        } catch (error) {
            console.log('\n❌ ========== STUDENT SEARCH ERROR ==========');
            console.error('💥 Error details:', error);
            console.log('❌ ========================================\n');
            
            logger.error('Error in searchStudents', {
                error: error.message,
                searchTerm,
                filters,
                tenantId
            });
            
            console.error('Error searching students:', error);
            throw new Error('Failed to search students.');
        }
    },

    async getDailyAttendance(campusId, roles, yearName, startDate, endDate, tenantId, classId = null, sectionId = null, client = pool) {
        try {
            // 2. Query Logic: Users x DateSeries LEFT JOIN UserAttendance
            const values = [campusId, startDate, endDate, tenantId]; // $1, $2, $3, $4
            let idx = 5;

            // Base Joins
            let userJoin = `
                JOIN user_statuses us ON u.username = us.username
                LEFT JOIN student_enrollment se ON u.username = se.username
                LEFT JOIN academic_years ay ON se.academic_year_id = ay.academic_year_id
                LEFT JOIN classes c ON se.class_id = c.class_id
            `;

            // Base Where - Step 1: Select all users of respective campusid and status as active
            let userWhere = "u.tenant_id = $4 AND us.campus_id = $1 AND us.status = 'active'";
            
            // Step 2: Filter role of selected roles
            if (roles && roles.length > 0) {
                userWhere += ` AND u.role = ANY($${idx})`;
                values.push(roles);
                idx++;
            }

            // Step 3 & 4: Student specific logic
            let studentFilters = [];
            if (yearName) {
                studentFilters.push(`ay.year_name = $${idx}`);
                values.push(yearName);
                idx++;
            }
            if (classId) {
                studentFilters.push(`c.class_id = $${idx}`);
                values.push(classId);
                idx++;
            }
            if (sectionId) {
                studentFilters.push(`se.section_id = $${idx}`);
                values.push(sectionId);
                idx++;
            }

            // Apply filters only to Students. Non-students are always included if they match base criteria.
            if (studentFilters.length > 0) {
                userWhere += ` AND (u.role != 'Student' OR (${studentFilters.join(' AND ')}))`;
            }
            
            // Attendance Join Condition - Step 5
            let attendanceJoinCondition = `
                ua.username = u.username 
                AND ua.attendance_date = d.date 
                AND ua.campus_id = $1
            `;
            
            if (yearName) {
                attendanceJoinCondition += ` AND ua.year_name = $${idx}`;
                values.push(yearName);
                idx++;
            }

            const query = `
                WITH date_series AS (
                    SELECT generate_series($2::date, $3::date, '1 day'::interval)::date AS date
                ),
                filtered_users AS (
                    SELECT DISTINCT u.user_id, u.username, u.first_name, u.last_name, u.role
                    FROM users u
                    ${userJoin}
                    WHERE ${userWhere}
                )
                SELECT 
                    d.date as attendance_date,
                    u.user_id,
                    u.username,
                    u.first_name,
                    u.last_name,
                    u.role,
                    COALESCE(ua.status, 'No Attendance') as status,
                    COALESCE(TO_CHAR(ua.duration, 'HH24:MI'), '00:00') as duration,
                    COALESCE(TO_CHAR(ua.total_duration, 'HH24:MI'), '00:00') as total_duration,
                    ua.login_time,
                    ua.logout_time,
                    EXTRACT(EPOCH FROM ua.duration) as duration_hours,
                    EXTRACT(EPOCH FROM ua.total_duration) as total_duration_hours
                FROM filtered_users u
                CROSS JOIN date_series d
                LEFT JOIN user_attendance ua ON ${attendanceJoinCondition}
                ORDER BY d.date DESC, u.username
            `;

            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('UserModel.getDailyAttendance error', error);
            throw error;
        }
    }
};



module.exports = UserModel;
