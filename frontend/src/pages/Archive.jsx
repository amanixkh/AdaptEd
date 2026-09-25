import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { PageHeading } from "../components/UI";
import { Archive, Trash2, ArchiveRestore } from "../components/Icons";
import "../polish.css";

export function ArchivePage() {
  const { tr, archivedLessons, refreshArchive, restoreLesson, deleteForeverLesson } = useApp();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    loadArchivedLessons();
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const id = setTimeout(() => setToastMessage(""), 2600);
    return () => clearTimeout(id);
  }, [toastMessage]);

  async function loadArchivedLessons() {
    setLoading(true);
    try {
      await refreshArchive();
    } catch (error) {
      console.error("Error loading archived lessons:", error);
      setToastMessage(tr("Failed to load archived lessons", "تعذّر تحميل الدروس المؤرشفة"));
    } finally {
      setLoading(false);
    }
  }

  // Restoring updates the shared lesson list too, so it reappears on History/Dashboard immediately.
  async function handleRestore(lessonId) {
    try {
      await restoreLesson(lessonId);
      setToastMessage(tr("Lesson restored successfully", "تمت استعادة الدرس بنجاح"));
      setConfirmingId(null);
    } catch (error) {
      console.error("Error restoring lesson:", error);
      setToastMessage(tr("Failed to restore lesson", "تعذّرت استعادة الدرس"));
    }
  }

  async function handleDeleteForever(lessonId) {
    try {
      await deleteForeverLesson(lessonId);
      setToastMessage(tr("Lesson permanently deleted", "تم حذف الدرس نهائياً"));
      setConfirmingId(null);
    } catch (error) {
      console.error("Error deleting lesson:", error);
      setToastMessage(tr("Failed to delete lesson", "تعذّر حذف الدرس"));
    }
  }

  const filtered = archivedLessons.filter((l) =>
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
                  <span>{tr("Uploaded", "رُفع")}: {new Date(lesson.created_at).toLocaleDateString()}</span>
                  <span>{tr("Archived", "أُرشف")}: {new Date(lesson.archived_at).toLocaleDateString()}</span>
                  <span className="pill">{lesson.generated_count || 0} {tr("Generated", "مُنشأ")}</span>
                </div>
              </div>

              <div className="archive-actions">
                {confirmingId === lesson.id ? (
                  <div className="confirm-dialog">
                    <p className="confirm-text">
                      {confirmAction === "restore"
                        ? tr("Restore this lesson to your library?", "استعادة هذا الدرس إلى مكتبتك؟")
                        : tr("Permanently delete this lesson? This cannot be undone.", "حذف هذا الدرس نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")}
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
                        className={confirmAction === "delete" ? "soft-btn danger-btn" : "secondary-btn"}
                      >
                        {confirmAction === "restore" ? tr("Restore", "استعادة") : tr("Delete Forever", "حذف نهائي")}
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="soft-btn"
                      >
                        {tr("Cancel", "إلغاء")}
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
                      className="secondary-btn"
                      title={tr("Restore to active lessons", "استعادة إلى الدروس النشطة")}
                    >
                      <ArchiveRestore size={18} />
                      {tr("Restore", "استعادة")}
                    </button>
                    <button
                      onClick={() => {
                        setConfirmingId(lesson.id);
                        setConfirmAction("delete");
                      }}
                      className="soft-btn danger-btn"
                      title={tr("Permanently delete (cannot undo)", "حذف نهائي (لا يمكن التراجع)")}
                    >
                      <Trash2 size={18} />
                      {tr("Delete", "حذف")}
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

