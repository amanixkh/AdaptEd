const pool = require("../config/db");
const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, title, message, related_id, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]);

    return res.status(200).json({
      success: true,
      notifications: result.rows,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }};

const getUnreadCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = $1
       AND is_read = FALSE`,
      [req.user.id] );

    return res.status(200).json({
      success: true,
      unreadCount: Number(result.rows[0].unread_count),
    });
  } catch (error) {
    console.error("Unread notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }};

const markAsRead = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1
       AND user_id = $2
       RETURNING id, is_read`,
      [req.params.notificationId, req.user.id] );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error("Mark notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }};

const deleteNotification = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM notifications
       WHERE id = $1
       AND user_id = $2
       RETURNING id`,
      [req.params.notificationId, req.user.id] );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }};

const createNotification = async (
  userId,
  type,
  title,
  message,
  relatedId = null
) => {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, type, title, message, related_id, is_read, created_at`,
      [userId, type, title, message, relatedId]
    );

 return result.rows[0];
  } catch (error) {
    console.error("Create notification error:", error);
    throw error;
  }};

module.exports = {getNotifications,getUnreadCount, markAsRead, deleteNotification, createNotification,
};