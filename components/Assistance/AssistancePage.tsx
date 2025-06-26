
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../App';
import { AssistanceRequest, AssistanceRequestStatus } from '../../types';
import { getAssistanceRequests, submitAssistanceRequest } from '../../services/dataService';
import Card from '../Common/Card';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';

const MAX_IMAGES_ASSISTANCE = 6;

// Icon for image placeholder
const PhotographIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);
// Icon for X mark
const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


const StatusBadge: React.FC<{ status: AssistanceRequestStatus }> = ({ status }) => {
  let colorClasses = '';
  switch (status) {
    case AssistanceRequestStatus.Aberto:
      colorClasses = 'bg-blue-100 text-blue-800';
      break;
    case AssistanceRequestStatus.EmAnalise:
      colorClasses = 'bg-yellow-100 text-yellow-800';
      break;
    case AssistanceRequestStatus.Agendado:
      colorClasses = 'bg-purple-100 text-purple-800';
      break;
    case AssistanceRequestStatus.Resolvido:
      colorClasses = 'bg-green-100 text-green-800';
      break;
    case AssistanceRequestStatus.Fechado:
      colorClasses = 'bg-gray-100 text-gray-800';
      break;
    default:
      colorClasses = 'bg-gray-100 text-gray-800';
  }
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colorClasses}`}>
      {status}
    </span>
  );
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const AssistancePage: React.FC = () => {
  const { currentUser, addNotification } = useAuth();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Use addNotification from useAuth context instead of local submitMessage
  // const [submitMessage, setSubmitMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);


  const fetchRequests = useCallback(async () => {
    if (currentUser) {
      setIsLoading(true);
      try {
        const data = await getAssistanceRequests(currentUser.id);
        setRequests(data);
      } catch (error) {
        console.error("Failed to fetch assistance requests", error);
        addNotification("Erro ao carregar solicitações de assistência.", "error");
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentUser, addNotification]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const resetFormFields = () => {
    setSubject('');
    setDescription('');
    setImageFiles([]);
    setImagePreviews([]);
    const fileInput = document.getElementById('assistanceImages') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFilesArray = Array.from(files);
      if (imageFiles.length + newFilesArray.length > MAX_IMAGES_ASSISTANCE) {
        addNotification(`Você pode selecionar no máximo ${MAX_IMAGES_ASSISTANCE} imagens.`, "error");
        event.target.value = ''; 
        return;
      }

      setImageFiles(prevFiles => [...prevFiles, ...newFilesArray].slice(0, MAX_IMAGES_ASSISTANCE));

      const newPreviewsPromises = newFilesArray.map(file => fileToBase64(file));
      Promise.all(newPreviewsPromises).then(base64Strings => {
        setImagePreviews(prevPreviews => [...prevPreviews, ...base64Strings].slice(0, MAX_IMAGES_ASSISTANCE));
      });
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setImagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
     // It's tricky to reset the file input reliably after removing one of potentially multiple files.
     // For simplicity, we don't try to reset the input value here, but this means a user cannot
     // immediately re-add the exact same file instance unless they select a different set of files first or refresh.
     // This is a common limitation without more complex input handling.
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !subject.trim() || !description.trim()) {
        addNotification("Assunto e descrição são obrigatórios.", "error");
        return;
    }
    setIsSubmitting(true);

    const uploadedImageUrls: string[] = [];
    if (imageFiles.length > 0) {
        const base64Promises = imageFiles.map(file => fileToBase64(file));
        try {
            const base64Strings = await Promise.all(base64Promises);
            uploadedImageUrls.push(...base64Strings);
        } catch (error) {
            console.error("Error converting images to base64", error);
            addNotification("Erro ao processar imagens. Tente novamente.", "error");
            setIsSubmitting(false);
            return;
        }
    }

    try {
      await submitAssistanceRequest(currentUser.id, { 
        subject, 
        description, 
        imageUrls: uploadedImageUrls 
      });
      resetFormFields();
      setShowForm(false);
      addNotification("Solicitação enviada com sucesso!", "success");
      fetchRequests(); // Refresh list
    } catch (error) {
      console.error("Failed to submit assistance request", error);
      addNotification("Erro ao enviar solicitação. Tente novamente.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title={showForm ? "Nova Solicitação de Assistência" : "Suas Solicitações de Assistência"}>
        {!showForm ? (
            <Button onClick={() => { setShowForm(true); resetFormFields(); }} variant="primary" className="mb-6">
                Abrir Nova Solicitação
            </Button>
        ) : (
             <Button onClick={() => { setShowForm(false); resetFormFields(); }} variant="secondary" className="mb-6">
                Cancelar e Voltar
            </Button>
        )}

        {/* submitMessage is now handled by global addNotification */}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Assunto</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição Detalhada</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <label htmlFor="assistanceImages" className="block text-sm font-medium text-gray-700">
                Adicionar Imagens (opcional, máx. {MAX_IMAGES_ASSISTANCE})
              </label>
              <input
                type="file"
                id="assistanceImages"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                disabled={imageFiles.length >= MAX_IMAGES_ASSISTANCE}
              />
              {imageFiles.length >= MAX_IMAGES_ASSISTANCE && (
                <p className="text-xs text-red-500 mt-1">Limite de {MAX_IMAGES_ASSISTANCE} imagens atingido.</p>
              )}
              {imagePreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {imagePreviews.map((previewUrl, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-md shadow" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 focus:outline-none opacity-75 group-hover:opacity-100 transition-opacity"
                        aria-label="Remover imagem"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </form>
        )}
      </Card>

      {!showForm && (
        <Card title="Histórico de Solicitações">
            {isLoading ? (
            <LoadingSpinner text="Carregando histórico..." />
            ) : requests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma solicitação de assistência encontrada.</p>
            ) : (
            <div className="space-y-4">
                {requests.map(req => (
                <div key={req.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                    <h4 className="text-lg font-semibold text-sky-700">{req.subject}</h4>
                    <StatusBadge status={req.status} />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Data: {req.date}</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{req.description}</p>
                    
                    {req.imageUrls && req.imageUrls.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Imagens Anexadas:</p>
                        <div className="flex flex-wrap gap-2">
                          {req.imageUrls.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="w-20 h-20 block rounded-md overflow-hidden border hover:border-sky-500 transition-all">
                              <img src={url} alt={`Imagem ${idx + 1} da solicitação`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {req.resolutionNotes && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm font-semibold text-green-700">Resolução:</p>
                            <p className="text-sm text-green-600 whitespace-pre-wrap">{req.resolutionNotes}</p>
                        </div>
                    )}
                </div>
                ))}
            </div>
            )}
        </Card>
      )}
    </div>
  );
};

export default AssistancePage;