const consolidatedAttendanceService = require('../services/consolidatedAttendance.service');

async function getConsolidatedAttendanceController(req, res) {
    try {
        const traceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        const t0 = Date.now();
        const tenantId = req.user?.tenantId || req.tenantId;
        const campusId = req.user?.campusId || req.campusId;
        const { roles, academicYear, fromDate, toDate, classId, sectionId, limit, offset } = req.body;

        // #region debug-point A:controller-entry
        (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId: 'post', hypothesisId: 'A', location: 'consolidatedAttendance.controller.js', msg: '[DEBUG] consolidated-attendance request start', data: { campusId, tenantIdPresent: Boolean(tenantId), rolesCount: Array.isArray(roles) ? roles.length : 0, academicYearPresent: Boolean(academicYear), fromDate, toDate, classIdPresent: Boolean(classId), sectionIdPresent: Boolean(sectionId), limit: Number.isInteger(limit) ? limit : null, offset: Number.isInteger(offset) ? offset : null }, ts: Date.now(), traceId }) }).catch(() => {}) })();
        // #endregion

        const result = await consolidatedAttendanceService.getConsolidatedAttendance(
            campusId,
            roles || [],
            academicYear || null,
            fromDate,
            toDate,
            tenantId,
            classId,
            sectionId,
            {
                limit: Number.isInteger(limit) ? limit : undefined,
                offset: Number.isInteger(offset) ? offset : undefined,
                traceId,
                runId: 'post'
            }
        );

        if (result && typeof result === 'object' && Array.isArray(result.rows)) {
            // #region debug-point E:controller-exit-paged
            (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId: 'post', hypothesisId: 'E', location: 'consolidatedAttendance.controller.js', msg: '[DEBUG] consolidated-attendance response ready (paged)', data: { elapsedMs: Date.now() - t0, rows: result.rows.length, total: result.total, limit: result.limit, offset: result.offset }, ts: Date.now(), traceId }) }).catch(() => {}) })();
            // #endregion
            return res.status(200).json({
                success: true,
                data: result.rows,
                meta: {
                    total: result.total,
                    limit: result.limit,
                    offset: result.offset
                }
            });
        }

        // #region debug-point E:controller-exit-unpaged
        (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId: 'post', hypothesisId: 'E', location: 'consolidatedAttendance.controller.js', msg: '[DEBUG] consolidated-attendance response ready (unpaged)', data: { elapsedMs: Date.now() - t0, rows: Array.isArray(result) ? result.length : null }, ts: Date.now(), traceId }) }).catch(() => {}) })();
        // #endregion

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        // #region debug-point D:controller-error
        (() => { const fs = require('fs'); const ps = ['.dbg/consolidated-attendance-timeout.env', '../.dbg/consolidated-attendance-timeout.env']; let u = 'http://127.0.0.1:7777/event', s = 'consolidated-attendance-timeout'; for (const p of ps) { try { const e = fs.readFileSync(p, 'utf8'); u = e.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || u; s = e.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || s; break; } catch {} } fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s, runId: 'post', hypothesisId: 'D', location: 'consolidatedAttendance.controller.js', msg: '[DEBUG] consolidated-attendance controller error', data: { error: error?.message }, ts: Date.now() }) }).catch(() => {}) })();
        // #endregion
        console.error('Error in getConsolidatedAttendanceController:', error);
        return res.status(500).json({ error: 'Failed to get consolidated attendance', details: error.message });
    }
}

module.exports = {
    getConsolidatedAttendanceController
};
