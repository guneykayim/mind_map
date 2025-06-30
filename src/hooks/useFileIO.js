import { useCallback } from 'react';

export const useFileIO = ({ serialize, deserialize, hasUnsavedChanges }) => {
    const handleExport = useCallback(async () => {
        const serializedData = serialize();

        if (window.showSaveFilePicker) {
            try {
                const options = {
                    suggestedName: 'mind-map.json',
                    types: [
                        {
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] },
                        },
                    ],
                };
                const handle = await window.showSaveFilePicker(options);
                const writable = await handle.createWritable();
                await writable.write(serializedData);
                await writable.close();
            } catch (err) {
                if (err.name === 'AbortError') {
                    // User cancelled the save dialog
                    console.log('Save operation was cancelled.');
                } else {
                    console.error('Error saving the file:', err);
                }
            }
        } else {
            // Fallback for browsers that do not support the API
            const blob = new Blob([serializedData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mind-map.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }, [serialize]);

    const handleImport = useCallback(() => {
        if (hasUnsavedChanges) {
            if (!window.confirm("You have unsaved changes. Are you sure you want to import a new mind map? Your current changes will be lost.")) {
                return;
            }
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileContent = e.target.result;
                    deserialize(fileContent);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }, [deserialize, hasUnsavedChanges]);

    return { handleExport, handleImport };
}; 