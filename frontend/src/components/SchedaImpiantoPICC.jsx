import { useState, useRef, useCallback, useEffect } from "react";
import { apiClient } from "@/App";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, FileText, Edit2, Trash2, Save, Printer, Download, FileDown, 
  RotateCw, RotateCcw, Crop, ZoomIn, ZoomOut, X, Upload, Image as ImageIcon,
  Maximize2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Opzioni per i tipi di catetere
const TIPO_CATETERE_OPTIONS = [
  { id: "cvc_non_tunnellizzato", label: "CVC non tunnellizzato (breve termine)" },
  { id: "cvc_tunnellizzato", label: "CVC tunnellizzato (lungo termine tipo Groshong, Hickman, Broviac)" },
  { id: "picc", label: "CVC medio termine (PICC)" },
  { id: "port", label: "PORT (lungo termine)" },
  { id: "midline", label: "Midline" },
];

// Opzioni posizionamento CVC
const POSIZIONAMENTO_CVC_OPTIONS = [
  { id: "succlavia_dx", label: "succlavia dx" },
  { id: "succlavia_sn", label: "succlavia sn" },
  { id: "giugulare_dx", label: "giugulare interna dx" },
  { id: "giugulare_sn", label: "giugulare interna sn" },
  { id: "altro", label: "altro" },
];

// Opzioni vena PICC
const VENA_OPTIONS = [
  { id: "basilica", label: "Basilica" },
  { id: "cefalica", label: "Cefalica" },
  { id: "brachiale", label: "Brachiale" },
];

// Opzioni disinfezione
const DISINFEZIONE_OPTIONS = [
  { id: "clorexidina_2", label: "CLOREXIDINA IN SOLUZIONE ALCOLICA 2%" },
  { id: "iodiopovidone", label: "IODIOPOVIDONE" },
];

// Opzioni motivazione
const MOTIVAZIONE_OPTIONS = [
  { id: "chemioterapia", label: "chemioterapia" },
  { id: "difficolta_vene", label: "difficoltà nel reperire vene" },
  { id: "terapia_prolungata", label: "terapia prolungata" },
  { id: "monitoraggio", label: "monitoraggio invasivo" },
  { id: "altro", label: "altro" },
];

// Componente per Image Cropper
const ImageCropper = ({ imageData, onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      // Initialize crop to full image
      setCrop({ x: 0, y: 0, width: img.width, height: img.height });
    };
    img.src = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
  }, [imageData]);

  const handleRotate = (direction) => {
    setRotation(prev => (prev + (direction === 'cw' ? 90 : -90)) % 360);
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
  };

  const handleSaveCrop = () => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Calculate dimensions based on rotation
    const isRotated = rotation % 180 !== 0;
    const finalWidth = isRotated ? img.height : img.width;
    const finalHeight = isRotated ? img.width : img.height;

    canvas.width = finalWidth * zoom;
    canvas.height = finalHeight * zoom;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    const croppedData = canvas.toDataURL('image/jpeg', 0.9);
    onSave(croppedData.split(',')[1]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => handleRotate('ccw')}>
          <RotateCcw className="h-4 w-4 mr-1" /> Ruota Sx
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleRotate('cw')}>
          <RotateCw className="h-4 w-4 mr-1" /> Ruota Dx
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleZoom(0.1)}>
          <ZoomIn className="h-4 w-4 mr-1" /> Zoom +
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleZoom(-0.1)}>
          <ZoomOut className="h-4 w-4 mr-1" /> Zoom -
        </Button>
      </div>

      <div 
        ref={containerRef}
        className="relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ minHeight: '300px', maxHeight: '60vh' }}
      >
        {imageLoaded && imageRef.current && (
          <img
            src={imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`}
            alt="Preview"
            style={{
              transform: `rotate(${rotation}deg) scale(${zoom})`,
              transition: 'transform 0.3s ease',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Annulla</Button>
        <Button onClick={handleSaveCrop}>
          <Save className="h-4 w-4 mr-1" /> Salva Modifiche
        </Button>
      </div>
    </div>
  );
};

// Componente per visualizzare foto con rotazione
const PhotoViewer = ({ photo, onEdit, onDelete, onCrop }) => {
  const [rotation, setRotation] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const handleRotate = (direction) => {
    setRotation(prev => (prev + (direction === 'cw' ? 90 : -90)) % 360);
  };

  const imageSrc = photo.image_data?.startsWith('data:') 
    ? photo.image_data 
    : `data:image/jpeg;base64,${photo.image_data}`;

  return (
    <>
      <div className="relative group border rounded-lg overflow-hidden bg-gray-50">
        {/* Container con aspect ratio fisso per evitare distorsioni */}
        <div 
          className="relative flex items-center justify-center p-2"
          style={{ 
            minHeight: '150px',
            maxHeight: '200px',
            overflow: 'hidden'
          }}
        >
          <img
            src={imageSrc}
            alt={photo.descrizione || 'Allegato'}
            className="max-w-full max-h-full object-contain cursor-pointer"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease',
            }}
            onClick={() => setShowFullscreen(true)}
          />
        </div>

        {/* Toolbar overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={() => handleRotate('ccw')}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={() => handleRotate('cw')}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={() => onCrop(photo)}
            >
              <Crop className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={() => setShowFullscreen(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-red-400 hover:bg-red-500/20"
              onClick={() => onDelete(photo.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {photo.descrizione && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {photo.descrizione}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
          <div className="relative flex flex-col h-full">
            <div className="flex items-center justify-between p-2 border-b">
              <span className="text-sm font-medium">{photo.descrizione || 'Visualizza foto'}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleRotate('ccw')}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleRotate('cw')}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(3, z + 0.2))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div 
              className="flex-1 flex items-center justify-center overflow-auto p-4 bg-gray-900"
              style={{ minHeight: '60vh' }}
            >
              <img
                src={imageSrc}
                alt={photo.descrizione || 'Allegato'}
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transition: 'transform 0.3s ease',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Form iniziale vuoto
const getEmptyFormData = () => ({
  // Header
  presidio_ospedaliero: "",
  codice: "",
  unita_operativa: "",
  data_presa_carico: format(new Date(), "yyyy-MM-dd"),
  cartella_clinica: "",
  
  // Sezione Catetere Già Presente
  catetere_presente: false,
  catetere_presente_tipo: "",
  catetere_presente_struttura: "",
  catetere_presente_data: "",
  catetere_presente_ora: "",
  catetere_presente_modalita: "", // emergenza_urgenza, programmato_elezione
  catetere_presente_rx: null, // true, false, null
  catetere_da_sostituire: null, // true, false, null
  
  // Sezione Impianto Catetere
  tipo_catetere: "",
  
  // Posizionamento CVC
  posizionamento_cvc: "",
  posizionamento_cvc_altro: "",
  
  // Posizionamento PICC
  braccio: "", // dx, sn
  vena: "",
  exit_site_cm: "",
  
  // Procedure
  valutazione_sito: null,
  ecoguidato: null,
  igiene_mani: null,
  precauzioni_barriera: null,
  
  // Disinfezione
  disinfezione: [], // clorexidina_2, iodiopovidone
  
  // Dispositivi e Medicazioni
  sutureless_device: null,
  medicazione_trasparente: null,
  medicazione_occlusiva: null,
  
  // Controlli
  controllo_rx: null,
  controllo_ecg: null,
  
  // Modalità e Motivazione
  modalita: "", // emergenza, urgenza, elezione
  motivazione: [], // chemioterapia, difficolta_vene, terapia_prolungata, monitoraggio, altro
  motivazione_altro: "",
  
  // Footer
  data_posizionamento: format(new Date(), "yyyy-MM-dd"),
  operatore: "",
  
  // Allegati
  allegati: []
});

export const SchedaImpiantoPICC = ({ patientId, ambulatorio, schede, onRefresh, patient }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScheda, setSelectedScheda] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(getEmptyFormData());
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [photoToCrop, setPhotoToCrop] = useState(null);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const fileInputRef = useRef(null);
  const printRef = useRef(null);

  const resetForm = () => {
    setFormData(getEmptyFormData());
    setUploadedPhotos([]);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const response = await apiClient.post("/schede-impianto-picc", {
        patient_id: patientId,
        ambulatorio,
        ...formData,
        allegati: uploadedPhotos.map(p => p.id || p.tempId)
      });
      toast.success("Scheda impianto creata");
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedScheda) return;
    setSaving(true);
    try {
      await apiClient.put(`/schede-impianto-picc/${selectedScheda.id}`, {
        ...formData,
        allegati: uploadedPhotos.map(p => p.id || p.tempId)
      });
      toast.success("Scheda aggiornata");
      setEditDialogOpen(false);
      setIsEditing(false);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore durante l'aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedScheda) return;
    try {
      await apiClient.delete(`/schede-impianto-picc/${selectedScheda.id}`);
      toast.success("Scheda eliminata");
      setDeleteDialogOpen(false);
      setSelectedScheda(null);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Errore durante l'eliminazione");
    }
  };

  const openEditDialog = (scheda) => {
    setSelectedScheda(scheda);
    setFormData({
      ...getEmptyFormData(),
      ...scheda
    });
    setUploadedPhotos(scheda.allegati_data || []);
    setIsEditing(false);
    setEditDialogOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1];
        const newPhoto = {
          tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          image_data: base64,
          descrizione: file.name,
          data: format(new Date(), "yyyy-MM-dd")
        };
        setUploadedPhotos(prev => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDeletePhoto = (photoId) => {
    setUploadedPhotos(prev => prev.filter(p => (p.id || p.tempId) !== photoId));
  };

  const handleCropPhoto = (photo) => {
    setPhotoToCrop(photo);
    setCropDialogOpen(true);
  };

  const handleSaveCrop = (croppedData) => {
    setUploadedPhotos(prev => prev.map(p => {
      if ((p.id || p.tempId) === (photoToCrop.id || photoToCrop.tempId)) {
        return { ...p, image_data: croppedData };
      }
      return p;
    }));
    setCropDialogOpen(false);
    setPhotoToCrop(null);
    toast.success("Immagine modificata");
  };

  // Genera PDF
  const handleDownloadPDF = async (scheda) => {
    try {
      const response = await apiClient.get(`/schede-impianto-picc/${scheda.id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `scheda_impianto_${scheda.data_posizionamento || 'nd'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF scaricato");
    } catch (error) {
      toast.error("Errore nel download del PDF");
    }
  };

  // Stampa
  const handlePrint = (scheda) => {
    openEditDialog(scheda);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Checkbox helper per array
  const toggleArrayValue = (field, value) => {
    setFormData(prev => {
      const arr = prev[field] || [];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) };
      }
      return { ...prev, [field]: [...arr, value] };
    });
  };

  // Render del form completo come da immagine
  const renderFullForm = (data, readOnly = false) => (
    <div className="space-y-6 text-sm print:text-xs">
      {/* HEADER */}
      <div className="border-2 border-gray-800 p-4 bg-gray-50 print:bg-white">
        <div className="text-center font-bold text-lg mb-4 print:text-base">
          SCHEDA IMPIANTO e GESTIONE ACCESSI VENOSI
        </div>
        <div className="text-right text-xs text-gray-500 -mt-8 mb-4">Allegato n. 2</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap min-w-[200px]">Presidio Ospedaliero/Struttura Sanitaria:</Label>
              <Input 
                value={data.presidio_ospedaliero || ''} 
                onChange={e => setFormData(p => ({...p, presidio_ospedaliero: e.target.value}))}
                disabled={readOnly}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Codice:</Label>
              <Input 
                value={data.codice || ''} 
                onChange={e => setFormData(p => ({...p, codice: e.target.value}))}
                disabled={readOnly}
                className="w-24"
              />
              <Label className="whitespace-nowrap ml-4">U.O.:</Label>
              <Input 
                value={data.unita_operativa || ''} 
                onChange={e => setFormData(p => ({...p, unita_operativa: e.target.value}))}
                disabled={readOnly}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Preso in carico dalla struttura dal:</Label>
              <Input 
                type="date"
                value={data.data_presa_carico || ''} 
                onChange={e => setFormData(p => ({...p, data_presa_carico: e.target.value}))}
                disabled={readOnly}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Cartella Clinica n.:</Label>
              <Input 
                value={data.cartella_clinica || ''} 
                onChange={e => setFormData(p => ({...p, cartella_clinica: e.target.value}))}
                disabled={readOnly}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Dati paziente (da patient prop) */}
        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">Cognome e Nome Paziente:</Label>
            <span className="font-semibold">{patient?.cognome} {patient?.nome}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Data di nascita:</Label>
              <span>{patient?.data_nascita || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label>Sesso:</Label>
              <span className="flex items-center gap-2">
                <Checkbox checked={patient?.sesso === 'M'} disabled /> M
                <Checkbox checked={patient?.sesso === 'F'} disabled /> F
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONE CATETERE GIÀ PRESENTE */}
      <div className="border-2 border-gray-800">
        <div className="bg-gray-200 px-4 py-2 font-bold text-center">
          SEZIONE CATETERE GIÀ PRESENTE
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs italic text-gray-600">
            Da compilare se catetere già presente al momento della presa in carico (ambulatoriale o in regime di degenza)
          </p>

          <div className="space-y-2">
            <Label className="font-semibold">Tipo di Catetere:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {TIPO_CATETERE_OPTIONS.map(opt => (
                <div key={opt.id} className="flex items-center gap-2">
                  <Checkbox 
                    checked={data.catetere_presente_tipo === opt.id}
                    onCheckedChange={(checked) => {
                      if (!readOnly) setFormData(p => ({...p, catetere_presente_tipo: checked ? opt.id : ''}));
                    }}
                    disabled={readOnly}
                  />
                  <span className="text-sm">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Riportare: Struttura/reparto dove il catetere è stato inserito:</Label>
              <Input 
                value={data.catetere_presente_struttura || ''} 
                onChange={e => setFormData(p => ({...p, catetere_presente_struttura: e.target.value}))}
                disabled={readOnly}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>data:</Label>
                <Input 
                  type="date"
                  value={data.catetere_presente_data || ''} 
                  onChange={e => setFormData(p => ({...p, catetere_presente_data: e.target.value}))}
                  disabled={readOnly}
                  className="w-36"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label>ora:</Label>
                <Input 
                  type="time"
                  value={data.catetere_presente_ora || ''} 
                  onChange={e => setFormData(p => ({...p, catetere_presente_ora: e.target.value}))}
                  disabled={readOnly}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Label>modalità:</Label>
              <Checkbox 
                checked={data.catetere_presente_modalita === 'emergenza_urgenza'}
                onCheckedChange={(checked) => {
                  if (!readOnly) setFormData(p => ({...p, catetere_presente_modalita: checked ? 'emergenza_urgenza' : ''}));
                }}
                disabled={readOnly}
              />
              <span>emergenza/urgenza</span>
              <Checkbox 
                checked={data.catetere_presente_modalita === 'programmato_elezione'}
                onCheckedChange={(checked) => {
                  if (!readOnly) setFormData(p => ({...p, catetere_presente_modalita: checked ? 'programmato_elezione' : ''}));
                }}
                disabled={readOnly}
              />
              <span>programmato/elezione</span>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Label>Se è stato effettuato controllo RX Post-Inserimento:</Label>
              <Checkbox 
                checked={data.catetere_presente_rx === true}
                onCheckedChange={(checked) => {
                  if (!readOnly) setFormData(p => ({...p, catetere_presente_rx: checked ? true : null}));
                }}
                disabled={readOnly}
              />
              <span>SI</span>
              <Checkbox 
                checked={data.catetere_presente_rx === false}
                onCheckedChange={(checked) => {
                  if (!readOnly) setFormData(p => ({...p, catetere_presente_rx: checked ? false : null}));
                }}
                disabled={readOnly}
              />
              <span>NO</span>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Label>Catetere da sostituire:</Label>
              <Checkbox 
                checked={data.catetere_da_sostituire === true}
                onCheckedChange={(checked) => {
                  if (!readOnly) setFormData(p => ({...p, catetere_da_sostituire: checked ? true : null}));
                }}
                disabled={readOnly}
              />
              <span>SI</span>
              <Checkbox 
                checked={data.catetere_da_sostituire === false}
                onCheckedChange={(checked) => {
                  if (!readOnly) setFormData(p => ({...p, catetere_da_sostituire: checked ? false : null}));
                }}
                disabled={readOnly}
              />
              <span>NO</span>
              <span className="text-xs text-gray-500 ml-2">se si compilare la SEZIONE IMPIANTO</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONE IMPIANTO CATETERE */}
      <div className="border-2 border-gray-800">
        <div className="bg-gray-200 px-4 py-2 font-bold text-center">
          SEZIONE IMPIANTO CATETERE
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs italic text-gray-600">
            Da compilare se catetere viene impiantato nella struttura
          </p>

          {/* TIPO DI CATETERE */}
          <div className="space-y-2">
            <Label className="font-semibold">TIPO DI CATETERE:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {TIPO_CATETERE_OPTIONS.map(opt => (
                <div key={opt.id} className="flex items-center gap-2">
                  <Checkbox 
                    checked={data.tipo_catetere === opt.id}
                    onCheckedChange={(checked) => {
                      if (!readOnly) setFormData(p => ({...p, tipo_catetere: checked ? opt.id : ''}));
                    }}
                    disabled={readOnly}
                  />
                  <span className="text-sm">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* POSIZIONAMENTO CVC */}
          <div className="space-y-2">
            <Label className="font-semibold">POSIZIONAMENTO CVC:</Label>
            <div className="flex items-center gap-4 flex-wrap">
              {POSIZIONAMENTO_CVC_OPTIONS.map(opt => (
                <div key={opt.id} className="flex items-center gap-1">
                  <Checkbox 
                    checked={data.posizionamento_cvc === opt.id}
                    onCheckedChange={(checked) => {
                      if (!readOnly) setFormData(p => ({...p, posizionamento_cvc: checked ? opt.id : ''}));
                    }}
                    disabled={readOnly}
                  />
                  <span className="text-sm">{opt.label}</span>
                </div>
              ))}
              {data.posizionamento_cvc === 'altro' && (
                <Input 
                  placeholder="specificare..."
                  value={data.posizionamento_cvc_altro || ''} 
                  onChange={e => setFormData(p => ({...p, posizionamento_cvc_altro: e.target.value}))}
                  disabled={readOnly}
                  className="w-40"
                />
              )}
            </div>
          </div>

          {/* POSIZIONAMENTO PICC */}
          <div className="space-y-2">
            <Label className="font-semibold">POSIZIONAMENTO PICC:</Label>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={data.braccio === 'dx'}
                  onCheckedChange={(checked) => {
                    if (!readOnly) setFormData(p => ({...p, braccio: checked ? 'dx' : ''}));
                  }}
                  disabled={readOnly}
                />
                <span>braccio dx</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={data.braccio === 'sn'}
                  onCheckedChange={(checked) => {
                    if (!readOnly) setFormData(p => ({...p, braccio: checked ? 'sn' : ''}));
                  }}
                  disabled={readOnly}
                />
                <span>braccio sn</span>
              </div>
              
              <span className="font-medium ml-4">Vena:</span>
              {VENA_OPTIONS.map(opt => (
                <div key={opt.id} className="flex items-center gap-1">
                  <Checkbox 
                    checked={data.vena === opt.id}
                    onCheckedChange={(checked) => {
                      if (!readOnly) setFormData(p => ({...p, vena: checked ? opt.id : ''}));
                    }}
                    disabled={readOnly}
                  />
                  <span>{opt.label}</span>
                </div>
              ))}

              <div className="flex items-center gap-2 ml-4">
                <Label>Exit-site cm:</Label>
                <Input 
                  value={data.exit_site_cm || ''} 
                  onChange={e => setFormData(p => ({...p, exit_site_cm: e.target.value}))}
                  disabled={readOnly}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          {/* VALUTAZIONI E PROCEDURE */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="min-w-[300px]">VALUTAZIONE MIGLIOR SITO DI INSERIMENTO:</Label>
              <div className="flex items-center gap-2">
                <Checkbox checked={data.valutazione_sito === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, valutazione_sito: c ? true : null}))} disabled={readOnly} /><span>SI</span>
                <Checkbox checked={data.valutazione_sito === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, valutazione_sito: c ? false : null}))} disabled={readOnly} /><span>NO</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label className="min-w-[300px]">IMPIANTO ECOGUIDATO:</Label>
              <div className="flex items-center gap-2">
                <Checkbox checked={data.ecoguidato === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, ecoguidato: c ? true : null}))} disabled={readOnly} /><span>SI</span>
                <Checkbox checked={data.ecoguidato === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, ecoguidato: c ? false : null}))} disabled={readOnly} /><span>NO</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label className="min-w-[300px]">IGIENE DELLE MANI (LAVAGGIO ANTISETTICO O FRIZIONE ALCOLICA):</Label>
              <div className="flex items-center gap-2">
                <Checkbox checked={data.igiene_mani === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, igiene_mani: c ? true : null}))} disabled={readOnly} /><span>SI</span>
                <Checkbox checked={data.igiene_mani === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, igiene_mani: c ? false : null}))} disabled={readOnly} /><span>NO</span>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Label className="min-w-[300px]">UTILIZZO MASSIME PRECAUZIONI DI BARRIERA:</Label>
              <div className="flex items-center gap-2">
                <Checkbox checked={data.precauzioni_barriera === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, precauzioni_barriera: c ? true : null}))} disabled={readOnly} /><span>SI</span>
                <Checkbox checked={data.precauzioni_barriera === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, precauzioni_barriera: c ? false : null}))} disabled={readOnly} /><span>NO</span>
              </div>
              <span className="text-xs text-gray-500">(berretto, maschera, camice sterile, guanti sterili, telo sterile sul paziente)</span>
            </div>
          </div>

          {/* DISINFEZIONE */}
          <div className="space-y-2">
            <Label className="font-semibold">DISINFEZIONE DELLA CUTE INTEGRA:</Label>
            <div className="flex items-center gap-6 flex-wrap">
              {DISINFEZIONE_OPTIONS.map(opt => (
                <div key={opt.id} className="flex items-center gap-2">
                  <Checkbox 
                    checked={(data.disinfezione || []).includes(opt.id)}
                    onCheckedChange={() => !readOnly && toggleArrayValue('disinfezione', opt.id)}
                    disabled={readOnly}
                  />
                  <span className="text-sm">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DISPOSITIVI E MEDICAZIONI */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="min-w-[400px]">IMPIEGO DI "SUTURELESS DEVICES" PER IL FISSAGGIO DEL CATETERE:</Label>
              <div className="flex items-center gap-2">
                <Checkbox checked={data.sutureless_device === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, sutureless_device: c ? true : null}))} disabled={readOnly} /><span>SI</span>
                <Checkbox checked={data.sutureless_device === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, sutureless_device: c ? false : null}))} disabled={readOnly} /><span>NO</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label className="min-w-[400px]">IMPIEGO DI MEDICAZIONE SEMIPERMEABILE TRASPARENTE:</Label>
              <div className="flex items-center gap-2">
                <Checkbox checked={data.medicazione_trasparente === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, medicazione_trasparente: c ? true : null}))} disabled={readOnly} /><span>SI</span>
                <Checkbox checked={data.medicazione_trasparente === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, medicazione_trasparente: c ? false : null}))} disabled={readOnly} /><span>NO</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label className="min-w-[400px]">IMPIEGO DI MEDICAZIONE OCCLUSIVA:</Label>
              <div className="flex items-center gap-2">
                <Checkbox checked={data.medicazione_occlusiva === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, medicazione_occlusiva: c ? true : null}))} disabled={readOnly} /><span>SI</span>
                <Checkbox checked={data.medicazione_occlusiva === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, medicazione_occlusiva: c ? false : null}))} disabled={readOnly} /><span>NO</span>
              </div>
            </div>
          </div>

          {/* CONTROLLI */}
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex items-center gap-4">
              <Label>CONTROLLO RX POST-INSERIMENTO:</Label>
              <div className="flex items-center gap-2">
                <Checkbox checked={data.controllo_rx === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, controllo_rx: c ? true : null}))} disabled={readOnly} /><span>SI</span>
                <Checkbox checked={data.controllo_rx === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, controllo_rx: c ? false : null}))} disabled={readOnly} /><span>NO</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Label>CONTROLLO ECG POST INSERIMENTO:</Label>
              <div className="flex items-center gap-2">
                <Checkbox checked={data.controllo_ecg === true} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, controllo_ecg: c ? true : null}))} disabled={readOnly} /><span>SI</span>
                <Checkbox checked={data.controllo_ecg === false} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, controllo_ecg: c ? false : null}))} disabled={readOnly} /><span>NO</span>
              </div>
            </div>
          </div>

          {/* MODALITÀ */}
          <div className="space-y-2">
            <Label className="font-semibold">MODALITÀ:</Label>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Checkbox checked={data.modalita === 'emergenza'} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, modalita: c ? 'emergenza' : ''}))} disabled={readOnly} />
                <span>EMERGENZA</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={data.modalita === 'urgenza'} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, modalita: c ? 'urgenza' : ''}))} disabled={readOnly} />
                <span>URGENZA</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={data.modalita === 'elezione'} onCheckedChange={(c) => !readOnly && setFormData(p => ({...p, modalita: c ? 'elezione' : ''}))} disabled={readOnly} />
                <span>ELEZIONE</span>
              </div>
            </div>
          </div>

          {/* MOTIVAZIONE */}
          <div className="space-y-2">
            <Label className="font-semibold">MOTIVAZIONE DI INSERIMENTO CVC:</Label>
            <div className="flex items-center gap-4 flex-wrap">
              {MOTIVAZIONE_OPTIONS.map(opt => (
                <div key={opt.id} className="flex items-center gap-1">
                  <Checkbox 
                    checked={(data.motivazione || []).includes(opt.id)}
                    onCheckedChange={() => !readOnly && toggleArrayValue('motivazione', opt.id)}
                    disabled={readOnly}
                  />
                  <span className="text-sm">{opt.label}</span>
                </div>
              ))}
              {(data.motivazione || []).includes('altro') && (
                <Input 
                  placeholder="(specificare)"
                  value={data.motivazione_altro || ''} 
                  onChange={e => setFormData(p => ({...p, motivazione_altro: e.target.value}))}
                  disabled={readOnly}
                  className="w-48"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-2 border-gray-800 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap font-semibold">DATA POSIZIONAMENTO:</Label>
            <Input 
              type="date"
              value={data.data_posizionamento || ''} 
              onChange={e => setFormData(p => ({...p, data_posizionamento: e.target.value}))}
              disabled={readOnly}
              className="w-40"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">COGNOME NOME OPERATORE CHE HA IMPIANTATO IL CATETERE:</Label>
            <Input 
              value={data.operatore || ''} 
              onChange={e => setFormData(p => ({...p, operatore: e.target.value}))}
              disabled={readOnly}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">FIRMA:</Label>
            <div className="flex-1 border-b-2 border-gray-400 min-h-[30px]"></div>
          </div>
        </div>
      </div>

      {/* ALLEGATI / FOTO */}
      {!readOnly && (
        <div className="border-2 border-gray-800 p-4 space-y-4 print:hidden">
          <div className="flex items-center justify-between">
            <Label className="font-semibold text-base">ALLEGATI / FOTO</Label>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Carica Immagine
            </Button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          
          {uploadedPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedPhotos.map((photo) => (
                <PhotoViewer 
                  key={photo.id || photo.tempId}
                  photo={photo}
                  onDelete={handleDeletePhoto}
                  onCrop={handleCropPhoto}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nessun allegato. Clicca "Carica Immagine" per aggiungere foto.</p>
            </div>
          )}
        </div>
      )}

      {/* View allegati in readonly mode */}
      {readOnly && uploadedPhotos.length > 0 && (
        <div className="border-2 border-gray-800 p-4 space-y-4">
          <Label className="font-semibold text-base">ALLEGATI</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedPhotos.map((photo) => (
              <PhotoViewer 
                key={photo.id || photo.tempId}
                photo={photo}
                onDelete={() => {}}
                onCrop={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Schede Impianto PICC
        </h3>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="new-scheda-impianto-btn">
          <Plus className="h-4 w-4 mr-2" /> Nuova Scheda
        </Button>
      </div>

      {/* Lista schede esistenti */}
      {schede && schede.length > 0 ? (
        <div className="grid gap-4">
          {schede.map((scheda) => (
            <Card key={scheda.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Scheda del {scheda.data_posizionamento ? format(new Date(scheda.data_posizionamento), "dd/MM/yyyy", { locale: it }) : 'N/D'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handlePrint(scheda)} title="Stampa">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(scheda)} title="Scarica PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(scheda)} title="Visualizza/Modifica">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => { setSelectedScheda(scheda); setDeleteDialogOpen(true); }}
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tipo Catetere:</span>
                    <p className="font-medium">{TIPO_CATETERE_OPTIONS.find(o => o.id === scheda.tipo_catetere)?.label || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Braccio:</span>
                    <p className="font-medium">{scheda.braccio === 'dx' ? 'Destro' : scheda.braccio === 'sn' ? 'Sinistro' : '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Vena:</span>
                    <p className="font-medium">{VENA_OPTIONS.find(o => o.id === scheda.vena)?.label || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Operatore:</span>
                    <p className="font-medium">{scheda.operatore || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-50">
          <CardContent className="py-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nessuna scheda impianto registrata</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog Nuova Scheda */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Nuova Scheda Impianto e Gestione Accessi Venosi</DialogTitle>
            <DialogDescription>Compila tutti i campi necessari</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            {renderFullForm(formData, false)}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Salvataggio..." : "Salva Scheda"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizza/Modifica */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Scheda Impianto - {selectedScheda?.data_posizionamento ? format(new Date(selectedScheda.data_posizionamento), "dd/MM/yyyy") : ''}</span>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-1" /> Modifica
                  </Button>
                ) : null}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            {renderFullForm(formData, !isEditing)}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Annulla Modifiche</Button>
                <Button onClick={handleUpdate} disabled={saving}>
                  {saving ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Chiudi</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Conferma Eliminazione */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa scheda impianto? L'azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Crop Immagine */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modifica Immagine</DialogTitle>
            <DialogDescription>Ruota e ritaglia l'immagine come preferisci</DialogDescription>
          </DialogHeader>
          {photoToCrop && (
            <ImageCropper 
              imageData={photoToCrop.image_data}
              onSave={handleSaveCrop}
              onCancel={() => { setCropDialogOpen(false); setPhotoToCrop(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedaImpiantoPICC;
