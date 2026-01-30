import { useEditorStore } from './store/editorStore';
import { StartupWindow } from './components/StartupWindow/StartupWindow';
import { GalleryView } from './components/GalleryView/GalleryView';
import { Editor } from './components/Editor/Editor';

function App() {
  const appPhase = useEditorStore((state) => state.appPhase);

  switch (appPhase) {
    case 'startup':
      return <StartupWindow />;
    case 'gallery':
      return <GalleryView />;
    case 'editor':
      return <Editor />;
    default:
      return <StartupWindow />;
  }
}

export default App
