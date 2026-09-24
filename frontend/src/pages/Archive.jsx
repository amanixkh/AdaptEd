import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { PageHeading } from "../components/UI";
import { Archive, Trash2, ArchiveRestore } from "../components/Icons";
import { api } from "../services/api";
import "../polish.css";

export function ArchivePage() {
  const { tr } = useApp();
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    loadArchivedLessons();
  }, []);

  async function loadArchivedLessons() {
    setLoading(true);
    try {
      const result = await api.archived();
      setArchived(result.lessons || []);
    } catch (error) {
      console.error("Error loading archived lessons:", error);
      setToastMessage("Failed to load archived lessons");
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(lessonId) {
    try {
      await api.restore(lessonId);
      setArchived(archived.filter((l) => l.id !== lessonId));
      setToastMessage("Lesson restored successfully");
      setConfirmingId(null);
    } catch (error) {
      console.error("Error restoring lesson:", error);
      setToastMessage("Failed to restore lesson");
    }
  }

  async function handleDeleteForever(lessonId) {
    try {
      await api.deleteForever(lessonId);
      setArchived(archived.filter((l) => l.id !== lessonId));
      setToastMessage("Lesson permanently deleted");
      setConfirmingId(null);
    } catch (error) {
      console.error("Error deleting lesson:", error);
      setToastMessage("Failed to delete lesson");
    }
  }

  const filtered = archived.filter((l) =>
    (l.title || l.original_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="archive-container">
      <PageHeading
        eyebrow={tr("MANAGE YOUR LIBRARY", "إدارة مكتبتك")}
        title={tr("Archived Lessons", "الدروس المؤرشفة")}
        description={tr(
          "Restore or permanently delete archived lessons.",
          "استعد الدروس المؤرشفة أو احذفها نهائياً."
        )}
      />

      <div className="archive-controls">
        <input
          type="text"
          placeholder={tr("Search archived lessons…", "ابحث في الدروس المؤرشفة…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">{tr("Loading archived lessons…", "جارٍ تحميل الدروس المؤرشفة…")}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Archive size={48} />
          <h3>{search ? tr("No results found", "لا توجد نتائج") : tr("No archived lessons", "لا توجد دروس مؤرشفة")}</h3>
          <p>
            {search
              ? tr("Try adjusting your search", "حاول تعديل بحثك")
              : tr("Archive lessons to remove them from your active library", "أرشف الدروس لإزالتها من مكتبتك النشطة")}
          </p>
        </div>
      ) : (
        <div className="archive-list">
          {filtered.map((lesson) => (
            <div key={lesson.id} className="archive-row">
              <div className="archive-info">
                <h3>{lesson.title || lesson.original_name}</h3>
                <div className="archive-meta">
                  <span>Uploaded: {new Date(lesson.created_at).toLocaleDateString()}</span>
                  <span>Archived: {new Date(lesson.archived_at).toLocaleDateString()}</span>
                  <span className="pill">{lesson.generated_count || 0} Generated</span>
                </div>
              </div>

              <div className="archive-actions">
                {confirmingId === lesson.id ? (
                  <div className="confirm-dialog">
                    <p className="confirm-text">
                      {confirmAction === "restore"
                        ? "Restore this lesson to your library?"
                        : "Permanently delete this lesson? This cannot be undone."}
                    </p>
                    <div className="confirm-buttons">
                      <button
                        onClick={() => {
                          if (confirmAction === "restore") {
                            handleRestore(lesson.id);
                          } else {
                            handleDeleteForever(lesson.id);
                          }
                        }}
                        className={`confirm-btn ${confirmAction === "delete" ? "danger-btn" : "soft-btn"}`}
                      >
                        {confirmAction === "restore" ? "Restore" : "Delete Forever"}
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="soft-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setConfirmingId(lesson.id);
                        setConfirmAction("restore");
                      }}
                      className="soft-btn"
                      title="Restore to active lessons"
                    >
                      <ArchiveRestore size={18} />
                      Restore
                    </button>
                    <button
                      onClick={() => {
                        setConfirmingId(lesson.id);
                        setConfirmAction("delete");
                      }}
                      className="danger-btn"
                      title="Permanently delete (cannot undo)"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {toastMessage && (
        <div className="toast">
          <p>{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
