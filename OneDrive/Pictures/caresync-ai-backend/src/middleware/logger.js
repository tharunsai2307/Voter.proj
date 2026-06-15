import db from '../config/db.js';

export const auditLogger = async (req, res, next) => {
  // Capture response state
  const originalSend = res.send;
  
  res.send = function (body) {
    res.send = originalSend;
    res.send(body);

    // Run audit logging in background after response is sent
    // Only log modifying actions, or failed authorization logins
    const isModifying = ['POST', 'PUT', 'DELETE'].includes(req.method);
    const isAuthRoute = req.originalUrl.includes('/auth/');
    
    if (isModifying || isAuthRoute) {
      try {
        const userId = req.user ? req.user.id : null;
        const actionName = `${req.method} ${req.originalUrl}`;
        const ipAddress = req.ip || req.connection.remoteAddress;

        let resObj = {};
        try {
          resObj = JSON.parse(body);
        } catch(e) {}

        const details = {
          body: { ...req.body },
          query: req.query,
          params: req.params,
          statusCode: res.statusCode,
          success: resObj.success || false
        };

        // Redact password hash for login logs
        if (details.body && details.body.password) {
          details.body.password = '••••••••';
        }

        // Run non-blocking query to database
        db.query(
          'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
          [userId, actionName, JSON.stringify(details), ipAddress]
        ).catch(err => console.error("Audit log failed to record in database:", err.message));
        
      } catch (err) {
        console.error("Audit logger interceptor error:", err.message);
      }
    }
  };

  next();
};
