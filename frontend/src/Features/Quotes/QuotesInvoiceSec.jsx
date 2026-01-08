// QuotesInvoiceSec.jsx
import { useSearchParams } from 'react-router-dom';
import DirectQuoteForm from './DirectQuoteForm';
import TransitQuoteForm from './TransitQuoteForm';
import MultiModalQuoteForm from './MultiModalQuoteForm';
import WarehouseQuoteForm from './WarehouseQuoteForm';

export default function QuotesInvoiceSec() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category'); // air, sea
  const type = searchParams.get('type'); // direct, transit, multimodal, warehouse
  const mode = searchParams.get('mode'); // import, export, fcl, lcl
  

  const renderForm = () => {
    console.log("this is catagory ",category);
    if (type === 'direct') {
      return <DirectQuoteForm category={category} mode={mode} />;
    } else if (type === 'transit') {
      return <TransitQuoteForm category={category} mode={mode} />;
    } else if (type === 'multimodal') {
      return <MultiModalQuoteForm />;
    } else if (type === 'warehouse') {
      return <WarehouseQuoteForm />;
    }
    return <div className="p-6">Please select a freight type</div>;
  };

  return (
    <div className="p-6">
      {renderForm()}
    </div>
  );
}