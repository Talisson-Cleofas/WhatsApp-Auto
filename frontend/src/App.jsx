import SingleMessageForm from './components/SingleMessageForm';
import BulkMessageForm from './components/BulkMessageForm';
import MediaMessageForm from './components/MediaMessageForm';
import UploadForm from './components/UploadForm';
import BatchUploadForm from './components/BatchMediaForm';
import LabelsManager from "./components/LabelsManager";


function App() {
  return (
    <div style={{ padding: 20 }}>
      <h1>WhatsApp Sender via WPPConnect</h1>
      {/* <SingleMessageForm />
      <hr />
        <UploadForm />
      <hr /> */}
      <BulkMessageForm />
      <hr />
      {/* <MediaMessageForm />
      <hr /> */}
      <BatchUploadForm/>
      <hr />
      <LabelsManager />

    </div>
  );
}

export default App;
