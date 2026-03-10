function download(filename, content, mime) {
  const a = document.createElement('a');
  a.href = 'data:' + mime + ';charset=utf-8,' + encodeURIComponent(content);
  a.download = filename;
  a.click();
}

function confirmClear() {
  showConfirm(
    typeof t === 'function' && currentLang === 'ar' ? '��� ���� ��������' : 'Delete All Data',
    typeof t === 'function' && currentLang === 'ar' ? '�� ��� ����Ͽ �� ���� ���������� ��� �������.' : 'This will permanently delete ALL workout data. This cannot be undone.',
    () => {
      workouts = [];
      bodyWeight = [];
      waterToday = [];
      save();
      updateStatBar();
      postSaveHooks();
      showToast(typeof t === 'function' && currentLang === 'ar' ? '�� ��� ���� ��������' : 'All data cleared.', 'warn');
    }
  );
}
