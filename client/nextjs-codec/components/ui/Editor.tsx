import TextareaAutosize from 'react-textarea-autosize'

export default function Editor() {
  return (
    <div>
      <TextareaAutosize className='w-full border border-black overflow-hidden appearance-none resize-none' placeholder='Room description...' />
    </div>
  )
}