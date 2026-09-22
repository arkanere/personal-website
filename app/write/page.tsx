'use client'

/**
 * The writing tool, opened to everyone. It is the same four stages as the
 * admin editor, with nothing behind it: no article, no autosave, no request.
 * Whatever is typed here lives in React state and dies with the tab.
 */

import { useState } from 'react'
import { Header } from '@/components/Header'
import StageTabs, { WritingStage } from '@/components/StageTabs'
import BrainDumpPanel from '@/components/stages/BrainDumpPanel'
import DraftKeywordsPanel from '@/components/stages/DraftKeywordsPanel'
import TwmPanel from '@/components/stages/TwmPanel'
import TipTapEditor from '@/components/TipTapEditor'
import { composeDraft } from '@/lib/lifecycle'
import { Twm } from '@/lib/types/blog'

export default function WritePage() {
  const [stage, setStage] = useState<WritingStage>('braindump')
  const [title, setTitle] = useState('')
  const [braindump, setBraindump] = useState('')
  const [draftKeywords, setDraftKeywords] = useState<string[]>([])
  const [twms, setTwms] = useState<Twm[]>([])
  const [content, setContent] = useState('')

  const handleCompose = () => {
    if (content.trim() !== '' && !confirm(
      'This will replace the final format with the composed twms. Continue?'
    )) {
      return
    }

    setContent(composeDraft(twms))
    setStage('final')
  }

  return (
    <>
      <Header />
      <main className="container main">
        <h1 className="write-title">Write</h1>
        <p className="write-notice">
          Nothing here is saved. This page stores no writing, on your machine or
          on this site, and closing or reloading the tab loses it. Copy anything
          you want to keep before you leave.
        </p>

        <div className="write-field">
          <label className="write-label" htmlFor="write-title">
            Title
          </label>
          <input
            id="write-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="write-input"
            placeholder="Untitled"
            maxLength={255}
          />
        </div>

        <div className="write-stages">
          <StageTabs stage={stage} onChange={setStage} />
        </div>

        {stage === 'braindump' && (
          <BrainDumpPanel
            value={braindump}
            onChange={setBraindump}
            keywords={draftKeywords}
            onKeywordsChange={setDraftKeywords}
          />
        )}

        {stage === 'keywords' && (
          <DraftKeywordsPanel keywords={draftKeywords} onChange={setDraftKeywords} />
        )}

        {stage === 'twm' && (
          <TwmPanel
            twms={twms}
            keywords={draftKeywords}
            onChange={setTwms}
            onCompose={handleCompose}
          />
        )}

        {stage === 'final' && (
          <TipTapEditor content={content} onChange={setContent} />
        )}
      </main>
    </>
  )
}
