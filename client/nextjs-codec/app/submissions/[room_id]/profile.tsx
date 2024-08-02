import { Badge } from '@/components/ui/badge';
import BorderedContainer from '@/components/ui/wrappers/BorderedContainer';
import React, { useContext } from 'react';
import SafeHtml from '@/components/SafeHtml';
import Editor from '@monaco-editor/react';
import languageCodes from '@/utilities/languages_code.json';
import { UserContext } from '@/app/dashboard/contexts';
import moment from 'moment';

const langCodes: LanguageCodes = languageCodes;

export default function Profile({ type }: { type: string }) {
  const userData: any = useContext(UserContext)!;

  return (
    <BorderedContainer customStyle="w-full p-2 flex flex-col gap-2">
      <div className="flex justify-between">
        <div>
          <small className='text-secondary'>Submittee</small>
          <p>{userData?.learner}</p>
        </div>

        <div className="text-right">
          <small className='text-secondary'>Submission Date</small>
          <div className="flex gap-2">
            <span>
              {moment(userData?.submission_date).format('YYYY-MM-DD HH:mm:ss')}
            </span>
            <Badge
              variant={
                userData?.verdict === 'ACCEPTED' ? 'default' : 'destructive'
              }
              className="w-fit"
            >
              {userData?.verdict}
            </Badge>
          </div>
        </div>
      </div>

      <hr />

      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <small className="text-zinc-500">
            {userData?.language_used} | Code snippet
          </small>
          <small
            className={
              userData?.score === userData?.score_overall_count
                ? 'font-bold text-[green]'
                : ''
            }
          >
            {userData?.score} / {userData?.score_overall_count}
          </small>
        </div>
        {type === 'Mentor' ? (
          <Editor
            theme="vs-dark"
            defaultLanguage="plaintext"
            className="min-h-[250px]"
            // language={langCodes[String(userData?.language_used)]}
            options={{
              readOnly: true,
            }}
            value={userData?.code}
          />
        ) : (<div className="w-full text-center bg-zinc-700 rounded-lg p-5"><small className='text-zinc-400'>Solution hidden</small></div>)}
      </div>
    </BorderedContainer>
  );
}
