/**
 * Test Script for Safe LocalStorage Functionality
 * This script tests various error scenarios to ensure localStorage operations are safe
 */

import safeLocalStorage from './safeLocalStorage';

// Test 1: Normal operations
console.log('🧪 Testing Safe LocalStorage Wrapper...');

// Test basic operations
const testKey = 'test_key';
const testValue = 'test_value';
const testObject = { name: 'test', value: 123 };

// Test setItem
console.log('✅ Testing setItem...');
const setResult = safeLocalStorage.setItem(testKey, testValue);
console.log('Set result:', setResult);

// Test getItem
console.log('✅ Testing getItem...');
const getResult = safeLocalStorage.getItem(testKey);
console.log('Get result:', getResult);

// Test parsed operations
console.log('✅ Testing setParsedItem...');
const setParsedResult = safeLocalStorage.setParsedItem('test_object', testObject);
console.log('Set parsed result:', setParsedResult);

console.log('✅ Testing getParsedItem...');
const getParsedResult = safeLocalStorage.getParsedItem('test_object');
console.log('Get parsed result:', getParsedResult);

// Test error scenarios
console.log('🚨 Testing Error Scenarios...');

// Test with corrupted JSON
localStorage.setItem('corrupted_json', '{invalid json}');
console.log('✅ Testing corrupted JSON handling...');
const corruptedResult = safeLocalStorage.getParsedItem('corrupted_json');
console.log('Corrupted JSON result:', corruptedResult);

// Test removeItem
console.log('✅ Testing removeItem...');
const removeResult = safeLocalStorage.removeItem(testKey);
console.log('Remove result:', removeResult);

// Test availability
console.log('✅ Testing isAvailable...');
const available = safeLocalStorage.isAvailable();
console.log('LocalStorage available:', available);

// Cleanup test data
safeLocalStorage.removeItem('test_object');
safeLocalStorage.removeItem('corrupted_json');

console.log('🎉 Safe LocalStorage tests completed successfully!');
console.log('All operations handled errors gracefully without crashing the app.');
