import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { Patient } from '../types';

export const dataPortability = {
  exportPatientsCSV: async (patients: Patient[]) => {
    if (patients.length === 0) return;

    const header = "id,full_name,age,birth_date,sex,insurance,rut,phone,address,commune,notes\n";
    const rows = patients.map(p => {
      return `"${p.id}","${p.full_name}",${p.age},"${p.birth_date}","${p.sex}","${p.insurance}","${p.rut || ''}","${p.phone || ''}","${p.address || ''}","${p.commune || ''}","${p.notes || ''}"`;
    }).join("\n");

    const csvContent = header + rows;
    const fileName = `Pacientes_Export_${new Date().getTime()}.csv`;

    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const filePath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, csvContent, { encoding: 'utf8' });
        await Sharing.shareAsync(filePath, { mimeType: 'text/csv', dialogTitle: 'Exportar Pacientes' });
      }
    } catch (error) {
      console.error('Export Error:', error);
      throw error;
    }
  },

  importPatientsCSV: async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv' });
      if (result.canceled) return null;

      const fileUri = result.assets[0].uri;
      
      let content = '';
      if (Platform.OS === 'web') {
         if (result.assets[0].file) {
             content = await result.assets[0].file.text();
         }
      } else {
         content = await FileSystem.readAsStringAsync(fileUri);
      }
      
      if (!content) return null;
      
      const lines = content.split('\n');
      const patients: Partial<Patient>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!parts) continue;

        const clean = (s: string) => s ? s.replace(/^"|"$/g, '') : '';

        patients.push({
          full_name: clean(parts[1]),
          age: parseInt(parts[2]) || 0,
          birth_date: clean(parts[3]),
          sex: clean(parts[4]) as any,
          insurance: clean(parts[5]),
          rut: clean(parts[6]),
          phone: clean(parts[7]),
          address: clean(parts[8]),
          commune: clean(parts[9]),
          notes: clean(parts[10]),
        });
      }

      return patients;
    } catch (error) {
      console.error('Import Error:', error);
      throw error;
    }
  }
};
