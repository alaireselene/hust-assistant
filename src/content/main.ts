import { mount } from 'svelte'
import App from './views/App.svelte'

console.log('[CRXJS] Hello world from content script!')
console.log('[HUST Assistant] Content script loaded on:', window.location.href);


/**
 * Mount the Svelte app to the DOM.
 */
function mountApp() {
  const container = document.createElement('div')
  container.id = 'crxjs-app'
  document.body.appendChild(container)
  mount(App, {
    target: container,
  })
}

mountApp()

import { fetchTimetable, fetchStudentProfile, fetchSemesters, fetchFullStudentProfile } from './api_parser';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[HUST Assistant] Message received:', request.action);

  if (request.action === 'FETCH_SCHEDULE') {
    const { semester, studentId } = request;
    fetchTimetable(semester, studentId)
      .then(data => {
        console.log('[HUST Assistant] Timetable fetched successfully');
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error('[HUST Assistant] Error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === 'FETCH_PROFILE') {
    fetchStudentProfile()
      .then(profile => {
        if (profile) {
          console.log('[HUST Assistant] Profile fetched successfully');
          sendResponse({ success: true, data: profile });
        } else {
          sendResponse({ success: false, error: 'Could not fetch profile' });
        }
      })
      .catch(error => {
        console.error('[HUST Assistant] Error fetching profile:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === 'FETCH_SEMESTERS') {
    fetchSemesters()
      .then(semesters => {
        console.log('[HUST Assistant] Semesters fetched successfully');
        sendResponse({ success: true, data: semesters });
      })
      .catch(error => {
        console.error('[HUST Assistant] Error fetching semesters:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === 'FETCH_FULL_PROFILE') {
    const { studentId } = request;
    fetchFullStudentProfile(studentId)
      .then(profile => {
        if (profile) {
          console.log('[HUST Assistant] Full profile fetched successfully');
          sendResponse({ success: true, data: profile });
        } else {
          sendResponse({ success: false, error: 'Could not fetch full profile' });
        }
      })
      .catch(error => {
        console.error('[HUST Assistant] Error fetching full profile:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  return false;
});
