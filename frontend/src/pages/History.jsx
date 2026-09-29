
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { demoBlocked } from '../utils/demoGuard'
import { uploadPath } from '../utils/paths'
import { Search, Plus, Archive, BookOpen } from '../components/Icons'
import { useApp } from '../context/AppContext'
import { PageHeading, Empty, LessonRow, ErrorBox, Busy, Toast } from '../components/UI'

export default function History() {
    const { tr, user, lessons, archiveLesson } = useApp()
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('new')
    const [filter, setFilter] = useState('all')
    const [confirming, setConfirming] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState('')
    const [toast, setToast] = useState('')

    const list = lessons
        .filter(lesson => {
            const matchesQuery = `${lesson.title} ${lesson.fileName}`
                .toLowerCase()
                .includes(query.toLowerCase())

            const matchesFilter =
                filter === 'all' ||
                (filter === 'ready'
                    ? Object.keys(lesson.outputs).length > 0
                    : Object.keys(lesson.outputs).length === 0)

            return matchesQuery && matchesFilter
        })
        .sort((first, second) =>
            sort === 'name'
                ? first.title.localeCompare(second.title)
                : sort === 'old'
                    ? new Date(first.createdAt) - new Date(second.createdAt)
                    : new Date(second.createdAt) - new Date(first.createdAt)
        )

    useEffect(() => {
        if (!toast) return undefined

        const id = setTimeout(() => setToast(''), 2600)

        return () => clearTimeout(id)
    }, [toast])

    async function remove() {
        if (demoBlocked(user)) return
        if (!confirming) return

        setDeleting(true)
        setError('')
        setToast('')

        try {
            await archiveLesson(confirming.id)

            setToast(
                tr(
                    'Lesson archived successfully.',
                    'تم أرشفة الدرس بنجاح.'
                )
            )

            setConfirming(null)
        } catch {
            setError(
                tr(
                    'Could not archive this lesson. Please try again.',
                    'تعذّر أرشفة الدرس. حاول مجدداً.'
                )
            )
        } finally {
            setDeleting(false)
        }
    }

    return (
        <>
            <section className="library-feature">
                <div className="library-feature-copy">
            <PageHeading
                eyebrow={tr(
                    'YOUR KNOWLEDGE, ORGANISED',
                    'معرفتك في مكان واحد'
                )}
                title={tr(
                    'Every lesson, within reach.',
                    'كل دروسك، بين يديك.'
                )}
                description={tr(
                    'Return to your lessons and continue where you left off.',
                    'ارجع إلى دروسك وأكمل من حيث توقّفت.'
                )}
            >
                <Link to={uploadPath(user)} className="primary-btn">
                    <Plus size={18} />
                    {tr('New lesson', 'درس جديد')}
                </Link>
            </PageHeading>

                <div className="library-feature-stats"><span><strong>{lessons.length}</strong>{tr('Lessons', 'دروس')}</span><span><strong>{lessons.reduce((count, lesson) => count + Object.keys(lesson.outputs || {}).length, 0)}</strong>{tr('Saved versions', 'نسخ محفوظة')}</span></div>
                </div>
                <div className="library-feature-art" aria-hidden="true"><div className="library-book library-book-back"/><div className="library-book library-book-front"><BookOpen size={30}/><i/><i/><i/></div><span className="library-spark">✦</span></div>
            </section>

            <section className="panel">
                <div className="library-toolbar">
                    <label className="search-field">
                        <Search size={18} />

                        <input
                            aria-label={tr(
                                'Search lessons',
                                'البحث في الدروس'
                            )}
                            placeholder={tr(
                                'Search lessons...',
                                'ابحث عن درس...'
                            )}
                            value={query}
                            onChange={event => setQuery(event.target.value)}
                        />
                    </label>

                    <select
                        aria-label={tr(
                            'Filter lessons',
                            'تصفية الدروس'
                        )}
                        value={filter}
                        onChange={event => setFilter(event.target.value)}
                    >
                        <option value="all">
                            {tr('All lessons', 'كل الدروس')}
                        </option>

                        <option value="ready">
                            {tr('With versions', 'مع نسخ محفوظة')}
                        </option>

                        <option value="draft">
                            {tr('Original only', 'النص الأصلي فقط')}
                        </option>
                    </select>

                    <select
                        aria-label={tr(
                            'Sort lessons',
                            'ترتيب الدروس'
                        )}
                        value={sort}
                        onChange={event => setSort(event.target.value)}
                    >
                        <option value="new">
                            {tr('Newest first', 'الأحدث أولاً')}
                        </option>

                        <option value="old">
                            {tr('Oldest first', 'الأقدم أولاً')}
                        </option>

                        <option value="name">
                            {tr('By title', 'حسب العنوان')}
                        </option>
                    </select>
                </div>

                <ErrorBox>{error}</ErrorBox>

                <p className="result-count">
                    {list.length} {tr('lessons', 'دروس')}
                </p>

                {list.length ? (
                    <div className="history-list">
                        {list.map(lesson => (
                            <div className="history-row" key={lesson.id}>
                                <LessonRow lesson={lesson} />

                                <button
                                    className="icon-btn history-delete-btn"
                                    disabled={deleting}
                                    aria-label={tr(
                                        'Archive lesson',
                                        'أرشفة الدرس'
                                    )}
                                    title={tr(
                                        'Archive',
                                        'أرشفة'
                                    )}
                                    onClick={() => {
                                        setError('')
                                        setToast('')
                                        setConfirming(lesson)
                                    }}
                                >
                                    <Archive size={17} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty
                        title={
                            query || filter !== 'all'
                                ? tr(
                                    'No matching lessons',
                                    'لا توجد دروس مطابقة'
                                )
                                : tr(
                                    'No lessons yet',
                                    'لا توجد دروس بعد'
                                )
                        }
                        text={
                            query || filter !== 'all'
                                ? tr(
                                    'Try a different search or filter.',
                                    'جرّب بحثاً أو تصفية مختلفة.'
                                )
                                : tr(
                                    'Upload your first lesson to begin.',
                                    'ارفع درسك الأول للبدء.'
                                )
                        }
                        to={uploadPath(user)}
                        label={tr(
                            'Upload lesson',
                            'رفع درس'
                        )}
                    />
                )}
            </section>

            <Toast>{toast}</Toast>

            {confirming && (
                <ConfirmArchive
                    lesson={confirming}
                    busy={deleting}
                    tr={tr}
                    onCancel={() =>
                        !deleting && setConfirming(null)
                    }
                    onConfirm={remove}
                />
            )}
        </>
    )
}

function ConfirmArchive({
    lesson,
    busy,
    tr,
    onCancel,
    onConfirm
}) {
    const ref = useRef(null)

    useEffect(() => {
        const dialog = ref.current

        if (!dialog.open) {
            dialog.showModal()
        }

        return () => {
            if (dialog.open) {
                dialog.close()
            }
        }
    }, [])

    return (
        <dialog
            ref={ref}
            className="history-delete-dialog"
            onCancel={event => {
                event.preventDefault()
                onCancel()
            }}
        >
            <div className="confirm-delete">
                <p>
                    {tr(
                        'Move this lesson to Archive?',
                        'هل تريد نقل هذا الدرس إلى الأرشيف؟'
                    )}
                </p>

                <strong>{lesson.title}</strong>

                <div className="history-dialog-actions">
                    <button
                        className="soft-btn"
                        disabled={busy}
                        onClick={onCancel}
                    >
                        {tr('Cancel', 'إلغاء')}
                    </button>

                    <button
                        className="soft-btn"
                        disabled={busy}
                        onClick={onConfirm}
                    >
                        {busy ? (
                            <Busy>
                                {tr(
                                    'Archiving...',
                                    'جارٍ الأرشفة...'
                                )}
                            </Busy>
                        ) : (
                            <>
                                <Archive size={16} />
                                {tr('Archive', 'أرشفة')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </dialog>
    )
}
