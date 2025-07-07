import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions, // ← NEW
} from 'react-native';

function formatCurrency(value: string | number) {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(number)) return '';
  return number.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

function formatNumberInput(text: string) {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts[1];
  if (parts[1]?.length > 2) return parts[0] + '.' + parts[1].slice(0, 2);
  return cleaned;
}

export default function FinanceScreen() {
  // 👉  responsive flag
  const { width } = useWindowDimensions();
  const isSmall = width < 400;

  /* ---------- state & persistence (unchanged) ---------- */
  const [sheetName, setSheetName] = useState('');
  const [selectedSheet, setSelectedSheet] = useState('');
  const [goal, setGoal] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [incomes, setIncomes] = useState([{ label: '', amount: '' }]);
  const [outgoings, setOutgoings] = useState([{ label: '', amount: '' }]);
  const [savedSheets, setSavedSheets] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('savedSheets');
      if (stored) setSavedSheets(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('savedSheets', JSON.stringify(savedSheets));
    } catch { /* ignore */ }
  }, [savedSheets]);

  /* ---------- helpers (unchanged) ---------- */
  const addIncome = () => {
    if (!incomes[incomes.length - 1].amount) {
      Alert.alert('Please enter an amount before adding another.');
      return;
    }
    setIncomes([...incomes, { label: '', amount: '' }]);
  };
  const addOutgoing = () => {
    if (!outgoings[outgoings.length - 1].amount) {
      Alert.alert('Please enter an amount before adding another.');
      return;
    }
    setOutgoings([...outgoings, { label: '', amount: '' }]);
  };
  const deleteIncome = (i: number) => setIncomes(incomes.filter((_, idx) => idx !== i));
  const deleteOutgoing = (i: number) => setOutgoings(outgoings.filter((_, idx) => idx !== i));

  const updateIncomeLabel = (t: string, i: number) =>
    setIncomes(incomes.map((row, idx) => (idx === i ? { ...row, label: t } : row)));
  const updateIncomeAmount = (t: string, i: number) =>
    setIncomes(incomes.map((row, idx) => (idx === i ? { ...row, amount: formatNumberInput(t) } : row)));
  const updateOutgoingLabel = (t: string, i: number) =>
    setOutgoings(outgoings.map((row, idx) => (idx === i ? { ...row, label: t } : row)));
  const updateOutgoingAmount = (t: string, i: number) =>
    setOutgoings(outgoings.map((row, idx) => (idx === i ? { ...row, amount: formatNumberInput(t) } : row)));

  const resetAll = () => {
    setSheetName('');
    setSelectedSheet('');
    setGoal('');
    setCurrentBalance('');
    setIncomes([{ label: '', amount: '' }]);
    setOutgoings([{ label: '', amount: '' }]);
  };

  const saveSheet = () => {
    if (!sheetName.trim()) {
      Alert.alert('Please enter a sheet name to save.');
      return;
    }
    setSavedSheets(prev => ({
      ...prev,
      [sheetName]: { goal, currentBalance, incomes, outgoings },
    }));
    setSelectedSheet(sheetName);
    Alert.alert('Sheet saved!');
  };

  const loadSheet = (name: string) => {
    if (!name) return resetAll();
    const sheet = savedSheets[name];
    if (sheet) {
      setSheetName(name);
      setGoal(sheet.goal);
      setCurrentBalance(sheet.currentBalance);
      setIncomes(sheet.incomes);
      setOutgoings(sheet.outgoings);
      setSelectedSheet(name);
    }
  };

  /* ---------- calculations (unchanged) ---------- */
  const totalIncome = incomes.reduce((s, v) => s + (parseFloat(v.amount) || 0), 0);
  const totalOutgoings = outgoings.reduce((s, v) => s + (parseFloat(v.amount) || 0), 0);
  const difference = totalIncome - totalOutgoings;
  const numericGoal = parseFloat(goal) || 0;
  const numericCurrentBalance = parseFloat(currentBalance) || 0;
  const needed = numericGoal > numericCurrentBalance ? numericGoal - numericCurrentBalance : 0;
  const months = difference > 0 ? Math.ceil(needed / difference) : '∞';
  const reachedGoal = numericGoal && numericCurrentBalance >= numericGoal;

  /* ---------- render ---------- */
  return (
    <LinearGradient colors={['#e0eafc', '#cfdef3']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Saving Goal Calculator</Text>

        {/* Sheet picker */}
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedSheet}
            onValueChange={loadSheet}
            style={styles.picker}
            dropdownIconColor="#007bff"
          >
            <Picker.Item label="-- Select a sheet --" value="" />
            {Object.keys(savedSheets).map(name => (
              <Picker.Item key={name} label={name} value={name} />
            ))}
          </Picker>
        </View>

        <Text style={styles.sectionTitle}>Sheet Details</Text>
        <TextInput
          placeholder="Sheet Name"
          value={sheetName}
          onChangeText={setSheetName}
          style={styles.inputBox}
        />

        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Goal & Balance</Text>

        {/* Goal / balance – stack on small screens */}
        <View style={[styles.goalRow, isSmall && { flexDirection: 'column' }]}>
          <TextInput
            placeholder="Saving Goal"
            keyboardType="numeric"
            value={goal}
            onChangeText={t => setGoal(formatNumberInput(t))}
            style={[styles.inputBox, styles.flex1, isSmall ? { marginRight: 0 } : { marginRight: 10 }]}
          />
          <TextInput
            placeholder="Current Balance"
            keyboardType="numeric"
            value={currentBalance}
            onChangeText={t => setCurrentBalance(formatNumberInput(t))}
            style={[styles.inputBox, styles.flex1]}
          />
        </View>

        {/* Income + Outgoings – stack columns on small screens */}
        <View style={[styles.columnsRow, isSmall && { flexDirection: 'column' }]}>
          {/* Income column */}
          <View style={styles.column}>
            <Text style={styles.title}>Income</Text>
            {incomes.map(({ label, amount }, i) => (
              <View key={i} style={[styles.row, isSmall && { flexWrap: 'wrap' }]}>
                <TextInput
                  placeholder="Label (optional)"
                  value={label}
                  onChangeText={t => updateIncomeLabel(t, i)}
                  style={[styles.inputBox, styles.labelInput, isSmall && { width: '100%' }]}
                />
                <TextInput
                  placeholder="Amount"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={t => updateIncomeAmount(t, i)}
                  style={[
                    styles.inputBox,
                    styles.amountInput,
                    isSmall && { width: '100%', marginTop: 4 },
                  ]}
                />
                {incomes.length > 1 && (
                  <TouchableOpacity style={styles.deleteButton} onPress={() => deleteIncome(i)}>
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addIncome}>
              <Text style={styles.addText}>＋</Text>
            </TouchableOpacity>
          </View>

          {/* Outgoings column */}
          <View style={styles.column}>
            <Text style={styles.title}>Outgoings</Text>
            {outgoings.map(({ label, amount }, i) => (
              <View key={i} style={[styles.row, isSmall && { flexWrap: 'wrap' }]}>
                <TextInput
                  placeholder="Label (optional)"
                  value={label}
                  onChangeText={t => updateOutgoingLabel(t, i)}
                  style={[styles.inputBox, styles.labelInput, isSmall && { width: '100%' }]}
                />
                <TextInput
                  placeholder="Amount"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={t => updateOutgoingAmount(t, i)}
                  style={[
                    styles.inputBox,
                    styles.amountInput,
                    isSmall && { width: '100%', marginTop: 4 },
                  ]}
                />
                {outgoings.length > 1 && (
                  <TouchableOpacity style={styles.deleteButton} onPress={() => deleteOutgoing(i)}>
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addOutgoing}>
              <Text style={styles.addText}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Totals + goal info */}
        <View style={styles.totalsRow}>
          <Text style={styles.totalText}>Total Income: {formatCurrency(totalIncome)}</Text>
          <Text style={styles.totalText}>Total Outgoings: {formatCurrency(totalOutgoings)}</Text>
          <Text
            style={[
              styles.totalText,
              difference >= 0 ? styles.positive : styles.negative,
            ]}
          >
            Difference: {formatCurrency(difference)}
          </Text>

          {reachedGoal && (
            <Text style={[styles.infoText, styles.success]}>
              🎉 You have reached your goal!
            </Text>
          )}
          {!reachedGoal && numericGoal > 0 && difference > 0 && (
            <Text style={styles.infoText}>
              You need {formatCurrency(needed)} more to reach your goal.
            </Text>
          )}
          {!reachedGoal && numericGoal > 0 && difference <= 0 && (
            <Text style={[styles.infoText, styles.warning]}>
              Your monthly surplus is zero or negative, so the goal cannot be reached at this rate.
            </Text>
          )}
          {!reachedGoal && numericGoal > 0 && difference > 0 && (
            <Text style={styles.infoText}>
              Estimated months to reach goal: {months}
            </Text>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.saveButton} onPress={saveSheet}>
            <Text style={styles.buttonText}>Save Sheet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={resetAll}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

/* ---------------- styles (unchanged, plus tiny tweaks) ---------------- */
const styles = StyleSheet.create({
  gradient: { flex: 1, paddingTop: Platform.OS === 'android' ? 30 : 60 },
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginVertical: 10 },
  pickerWrapper: { borderColor: '#007bff', borderWidth: 1, borderRadius: 5, marginBottom: 10, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  inputBox: { borderColor: '#007bff', borderWidth: 1, borderRadius: 6, padding: 8, marginBottom: 10, backgroundColor: 'white' },
  goalRow: { flexDirection: 'row' },
  flex1: { flex: 1 },
  columnsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  column: { flex: 1, marginHorizontal: 5 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  labelInput: { flex: 2, marginRight: 5 },
  amountInput: { flex: 1, marginRight: 5, minWidth: 90 },   // minWidth helps wrapping
  deleteButton: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#ff4444', borderRadius: 4 },
  deleteText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  addButton: { backgroundColor: '#007bff', alignItems: 'center', padding: 8, borderRadius: 6 },
  addText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  totalsRow: { marginTop: 15, flexDirection: 'column', alignItems: 'flex-start' },
  totalText: { fontSize: 16, marginBottom: 4 },
  positive: { color: 'green' },
  negative: { color: 'red' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
  saveButton: { backgroundColor: '#28a745', padding: 10, borderRadius: 6, flex: 1, marginRight: 10, alignItems: 'center' },
  resetButton: { backgroundColor: '#dc3545', padding: 10, borderRadius: 6, flex: 1, marginLeft: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '600' },
  infoText: { fontSize: 16, textAlign: 'center', marginTop: 10 },
  success: { color: 'green' },
  warning: { color: 'orange' },
});
