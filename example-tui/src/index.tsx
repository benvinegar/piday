import { createCliRenderer } from "@opentui/core"
import { createRoot, useKeyboard } from "@opentui/react"
import { useState } from "react"

function App() {
  const [modalOpen, setModalOpen] = useState(false)

  useKeyboard((key) => {
    if (key.name === "q") {
      process.exit(0)
    }
    if (key.name === "escape") {
      if (modalOpen) {
        setModalOpen(false)
      } else {
        process.exit(0)
      }
    }
    if (key.name === "return" && !modalOpen) {
      setModalOpen(true)
    }
  })

  return (
    <box width="100%" height="100%" justifyContent="center" alignItems="center">
      {!modalOpen && (
        <box 
          width={30} 
          height={7} 
          border 
          borderColor="#7aa2f7"
          borderStyle="round"
          padding={1}
          backgroundColor="#1a1b26"
          onMouseDown={() => setModalOpen(true)}
          justifyContent="center"
          alignItems="center"
        >
          <text color="#7aa2f7" bold>  [ Open Modal ]  </text>
          <box height={1} />
          <text color="#565f89">  Click or Press Enter  </text>
        </box>
      )}
      {modalOpen && (
        <box 
          width={62} 
          height={20} 
          border 
          borderStyle="double"
          padding={1}
          backgroundColor="#1a1b26"
        >
          <box flexDirection="row" width="100%" height={3}>
            <box width={52}>
              <text color="#7aa2f7" bold> Modal header</text>
              <text color="#565f89"> #############################################</text>
            </box>
            <box 
              border 
              borderColor="#f7768e"
              backgroundColor="#f7768e"
              onMouseDown={() => setModalOpen(false)}
              justifyContent="center"
              alignItems="center"
              paddingX={1}
            >
              <text color="#1a1b26" bold>X</text>
            </box>
          </box>
          <box height={1} />
          <text color="#a9b1d6">This is the Modal contents!</text>
          <box height={1} />
          <text color="#565f89" dim>Click the X button or press Esc to close</text>
        </box>
      )}
    </box>
  )
}

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  useMouse: true,
})

createRoot(renderer).render(<App />)
