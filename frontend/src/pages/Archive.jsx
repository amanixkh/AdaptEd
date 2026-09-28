import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import {demoBlocked} from '../utils/demoGuard'
import { PageHeading } from "../components/UI";
import { Archive, Trash2, ArchiveRestore } from "../components/Icons";
import "../polish.css";

export function ArchivePage() {
  const { tr,lang,user,archivedLessons:archived,refreshArchive,restoreLesson,deleteForeverLesson } = useApp();
  const [loading, setLoading] = useState(true);
  const [busy,setBusy]=useState(false);
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const locale=lang==='en'?'en-GB':lang==='ckb'?'ckb-IQ':'ar-IQ';
  const date=value=>value?new Date(value).toLocaleDateString(locale):'—';

  async function loadArchivedLessons() {
    setLoading(true);
    try {
      await refreshArchive();
    } catch (error) {
      console.error("Error loading archived lessons:", error);
      setToastMessage(tr("Could not load archived lessons.", "تعذّر تحميل الدروس المؤرشفة."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadArchivedLessons(); }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const id = setTimeout(() => setToastMessage(""), 2600);
    return () => clearTimeout(id);
  }, [toastMessage]);

  async function handleRestore(lessonId) {if(demoBlocked(user))return;
    if(busy)return;setBusy(true);
    try {
      await restoreLesson(lessonId);
      setToastMessage(tr("Lesson restored to your library.", "رجع الدرس إلى مكتبتك."));
      setConfirmingId(null);
    } catch (error) {
      console.error("Error restoring lesson:", error);
      setToastMessage(tr("Could not restore this lesson.", "تعذّر استرجاع الدرس."));
    }finally{setBusy(false)}
  }

  async function handleDeleteForever(lessonId) {if(demoBlocked(user))return;
    if(busy)return;setBusy(true);
    try {
      await deleteForeverLesson(lessonId);
      setToastMessage(tr("Lesson deleted permanently.", "حُذف الدرس نهائياً."));
      setConfirmingId(null);
    } catch (error) {
      console.error("Error deleting lesson:", error);
      setToastMessage(tr("Could not delete this lesson.", "تعذّر حذف الدرس."));
    }finally{setBusy(false)}
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
                  <span>{tr("Uploaded","رُفع")}: {date(lesson.created_at)}</span>
                  <span>{tr("Archived","أُرشف")}: {date(lesson.archived_at)}</span>
                  <span className="pill">{lesson.generated_count || 0} {tr("versions","نسخ")}</span>
                </div>
              </div>

              <div className="archive-actions">
                {confirmingId === lesson.id ? (
                  <div className="confirm-dialog">
                    <p className="confirm-text">
                      {confirmAction === "restore"
                        ? tr("Restore this lesson to your library?","إرجاع هذا الدرس إلى مكتبتك؟")
                        : tr("Permanently delete this lesson? This cannot be undone.","حذف هذا الدرس نهائياً؟ لا يمكن التراجع.")}
                    </p>
                    <div className="confirm-buttons">
                      <button disabled={busy}
                        onClick={() => {
                          if (confirmAction === "restore") {
                            handleRestore(lesson.id);
                          } else {
                            handleDeleteForever(lesson.id);
                          }
                        }}
                        className={confirmAction === "delete" ? "soft-btn danger-btn" : "secondary-btn"}
                      >
                        {confirmAction === "restore" ? tr("Restore","استرجاع") : tr("Delete forever","حذف نهائي")}
                      </button>
                      <button disabled={busy}
                        onClick={() => setConfirmingId(null)}
                        className="soft-btn"
                      >
                        {tr("Cancel","إلغاء")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button disabled={busy}
                      onClick={() => {
                        setConfirmingId(lesson.id);
                        setConfirmAction("restore");
                      }}
                      className="soft-btn"
                      title={tr("Restore to active lessons","إرجاع إلى الدروس النشطة")}
                    >
                      <ArchiveRestore size={18} />
                      {tr("Restore","استرجاع")}
                    </button>
                    <button disabled={busy}
                      onClick={() => {
                        setConfirmingId(lesson.id);
                        setConfirmAction("delete");
                      }}
                      className="soft-btn danger-btn"
                      title={tr("Permanently delete (cannot undo)","حذف نهائي (لا يمكن التراجع)")}
                    >
                      <Trash2 size={18} />
                      {tr("Delete","حذف")}
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
