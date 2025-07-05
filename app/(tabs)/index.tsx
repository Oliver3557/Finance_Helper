import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react'; // added useEffect
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

function formatCurrency(value: string | number) {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(number)) return '';
  return number.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

function formatNumberInput(text: string) {
  // Allow digits and max two decimals, no negatives
  const cleaned = text.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts[1]; // Prevent multiple decimals
  if (parts[1]?.length > 2) {
    return parts[0] + '.' + parts[1].slice(0, 2);
  }
  return cleaned;
}

export default function FinanceScreen() {
  const [sheetName, setSheetName] = useState('');
  const [selectedSheet, setSelectedSheet] = useState('');
  const [goal, setGoal] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [incomes, setIncomes] = useState([{ label: '', amount: '' }]);
  const [outgoings, setOutgoings] = useState([{ label: '', amount: '' }]);
  const [savedSheets, setSavedSheets] = useState<{ [key: string]: any }>({});

  // Load saved sheets from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedSheets');
      if (saved) {
        setSavedSheets(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load saved sheets from localStorage', e);
    }
  }, []);

  // Save sheets to localStorage whenever savedSheets changes
  useEffect(() => {
    try {
      localStorage.setItem('savedSheets', JSON.stringify(savedSheets));
    } catch (e) {
      console.warn('Failed to save sheets to localStorage', e);
    }
  }, [savedSheets]);

  // Add income or outgoing row if last amount is filled
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

  // Delete income/outgoing row by index
  const deleteIncome = (index: number) => {
    setIncomes(incomes.filter((_, i) => i !== index));
  };
  const deleteOutgoing = (index: number) => {
    setOutgoings(outgoings.filter((_, i) => i !== index));
  };

  // Update label or amount for income/outgoing
  const updateIncomeLabel = (text: string, index: number) => {
    const newIncomes = [...incomes];
    newIncomes[index].label = text;
    setIncomes(newIncomes);
  };
  const updateIncomeAmount = (text: string, index: number) => {
    const formatted = formatNumberInput(text);
    const newIncomes = [...incomes];
    newIncomes[index].amount = formatted;
    setIncomes(newIncomes);
  };

  const updateOutgoingLabel = (text: string, index: number) => {
    const newOutgoings = [...outgoings];
    newOutgoings[index].label = text;
    setOutgoings(newOutgoings);
  };
  const updateOutgoingAmount = (text: string, index: number) => {
    const formatted = formatNumberInput(text);
    const newOutgoings = [...outgoings];
    newOutgoings[index].amount = formatted;
    setOutgoings(newOutgoings);
  };

  // Reset all inputs to default
  const resetAll = () => {
    setSheetName('');
    setSelectedSheet('');
    setGoal('');
    setCurrentBalance('');
    setIncomes([{ label: '', amount: '' }]);
    setOutgoings([{ label: '', amount: '' }]);
  };

  // Save current sheet logic
  const saveSheet = () => {
    if (!sheetName.trim()) {
      Alert.alert('Please enter a sheet name to save.');
      return;
    }
    setSavedSheets((prev) => ({
      ...prev,
      [sheetName]: {
        goal,
        currentBalance,
        incomes,
        outgoings,
      },
    }));
    setSelectedSheet(sheetName);
    Alert.alert('Sheet saved!');
  };

  // Load saved sheet
  const loadSheet = (name: string) => {
    if (name === '') {
      resetAll();
      return;
    }
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

  // Calculate totals and difference
  const totalIncome = incomes.reduce(
    (sum, val) => sum + (parseFloat(val.amount) || 0),
    0
  );
  const totalOutgoings = outgoings.reduce(
    (sum, val) => sum + (parseFloat(val.amount) || 0),
    0
  );
  const difference = totalIncome - totalOutgoings;

  // Calculate amounts for goal
  const numericGoal = parseFloat(goal) || 0;
  const numericCurrentBalance = parseFloat(currentBalance) || 0;
  const needed = numericGoal > numericCurrentBalance ? numericGoal - numericCurrentBalance : 0;

  // Months to reach goal
  const months = difference > 0 ? Math.ceil(needed / difference) : '∞';

  // Conditional messages
  const reachedGoal = numericGoal && numericCurrentBalance >= numericGoal;

  return (
    <LinearGradient colors={['#e0eafc', '#cfdef3']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Sheet Selector */}
        <Text style={styles.title}>Saving Goal Calculator</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedSheet}
            onValueChange={loadSheet}
            style={styles.picker}
            dropdownIconColor="#007bff"
          >
            <Picker.Item label="-- Select a sheet --" value="" />
            {Object.keys(savedSheets).map((name) => (
              <Picker.Item key={name} label={name} value={name} />
            ))}
          </Picker>
        </View>

        {/* Section Title: Sheet Details */}
        <Text style={styles.sectionTitle}>Sheet Details</Text>

        {/* Sheet Name Input */}
        <TextInput
          placeholder="Sheet Name"
          value={sheetName}
          onChangeText={setSheetName}
          style={styles.inputBox}
        />

        {/* Section Title: Goal & Balance */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Goal & Balance</Text>

        {/* Goal & Current Balance */}
        <View style={styles.goalRow}>
          <TextInput
            placeholder="Saving Goal"
            keyboardType="numeric"
            value={goal}
            onChangeText={(t) => setGoal(formatNumberInput(t))}
            style={[styles.inputBox, styles.flex1, { marginRight: 10 }]}
          />
          <TextInput
            placeholder="Current Balance"
            keyboardType="numeric"
            value={currentBalance}
            onChangeText={(t) => setCurrentBalance(formatNumberInput(t))}
            style={[styles.inputBox, styles.flex1]}
          />
        </View>

        {/* Income and Outgoings columns */}
        <View style={styles.columnsRow}>
          {/* Income */}
          <View style={styles.column}>
            <Text style={styles.title}>Income</Text>
            {incomes.map(({ label, amount }, i) => (
              <View key={i} style={styles.row}>
                <TextInput
                  placeholder="Label (optional)"
                  value={label}
                  onChangeText={(text) => updateIncomeLabel(text, i)}
                  style={[styles.inputBox, styles.labelInput]}
                />
                <TextInput
                  placeholder="Amount"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={(text) => updateIncomeAmount(text, i)}
                  style={[styles.inputBox, styles.amountInput]}
                />
                {incomes.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteIncome(i)}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addIncome}>
              <Text style={styles.addText}>＋</Text>
            </TouchableOpacity>
          </View>

          {/* Outgoings */}
          <View style={styles.column}>
            <Text style={styles.title}>Outgoings</Text>
            {outgoings.map(({ label, amount }, i) => (
              <View key={i} style={styles.row}>
                <TextInput
                  placeholder="Label (optional)"
                  value={label}
                  onChangeText={(text) => updateOutgoingLabel(text, i)}
                  style={[styles.inputBox, styles.labelInput]}
                />
                <TextInput
                  placeholder="Amount"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={(text) => updateOutgoingAmount(text, i)}
                  style={[styles.inputBox, styles.amountInput]}
                />
                {outgoings.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteOutgoing(i)}
                  >
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

        {/* Save and New Sheet Buttons */}
        <TouchableOpacity style={styles.saveButton} onPress={saveSheet}>
          <Text style={styles.saveText}>Save Sheet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.saveButton, styles.newSheetButton]} onPress={resetAll}>
          <Text style={styles.saveText}>New Sheet</Text>
        </TouchableOpacity>

        {/* Results Box */}
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>Total Income: {formatCurrency(totalIncome)}</Text>
          <Text style={styles.resultText}>Total Outgoings: {formatCurrency(totalOutgoings)}</Text>
          <Text style={[styles.resultText, difference >= 0 ? styles.positive : styles.negative]}>
            Difference: {formatCurrency(difference)}
          </Text>
          <Text style={styles.resultText}>
            Goal Needed: {formatCurrency(needed)}
          </Text>
          <Text style={styles.resultText}>
            Months to reach goal: {months}
          </Text>
          {reachedGoal && <Text style={styles.successMessage}>Goal reached!</Text>}
          {numericGoal && !reachedGoal && months === '∞' && (
            <Text style={styles.errorMessage}>
              You cannot reach the goal with the current balance and net difference.
            </Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 15,
    color: '#222',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 5,
    marginBottom: 15,
  },
  picker: {
    height: 40,
    width: '100%',
    color: '#007bff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 10,
    color: '#333',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
    color: '#000',
  },
  flex1: {
    flex: 1,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  columnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginHorizontal: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelInput: {
    flex: 1,
    marginRight: 5,
  },
  amountInput: {
    width: 90,
    textAlign: 'right',
  },
  deleteButton: {
    marginLeft: 5,
    backgroundColor: '#f44336',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  deleteText: {
    color: 'white',
    fontWeight: '700',
  },
  addButton: {
    marginTop: 5,
    backgroundColor: '#007bff',
    borderRadius: 3,
    paddingVertical: 5,
    alignItems: 'center',
  },
  addText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  saveButton: {
    marginTop: 15,
    backgroundColor: '#28a745',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  newSheetButton: {
    backgroundColor: '#6c757d',
  },
  saveText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  resultBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 5,
  },
  positive: {
    color: 'green',
  },
  negative: {
    color: 'red',
  },
  successMessage: {
    marginTop: 10,
    color: 'green',
    fontWeight: '700',
    fontSize: 16,
  },
  errorMessage: {
    marginTop: 10,
    color: 'red',
    fontWeight: '700',
    fontSize: 16,
  },
});
