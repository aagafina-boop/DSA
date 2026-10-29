(function () {
  const elements = {
    main: document.querySelector("main"),
    arrayToTreeButton: document.getElementById("kA"),
    treeToArrayButton: document.getElementById("kB"),
    minHeapButton: document.getElementById("tMin"),
    maxHeapButton: document.getElementById("tMax"),
    randomButton: document.getElementById("rand"),
    randomArrayButton: document.getElementById("randArray"),
    modeFreeButton: document.getElementById("mFree"),
    modeGuideButton: document.getElementById("mGuide"),
    input: document.getElementById("inp"),
    loadButton: document.getElementById("load"),
    error: document.getElementById("err"),
    hint: document.getElementById("hint"),
    brief: document.getElementById("brief"),
    progressPanel: document.getElementById("progressPanel"),
    progressLabel: document.getElementById("progressLabel"),
    progressCount: document.getElementById("progressCount"),
    progress: document.getElementById("progress"),
    stepper: document.getElementById("stepper"),
    stepText: document.getElementById("stepTxt"),
    backButton: document.getElementById("back"),
    nextButton: document.getElementById("next"),
    message: document.getElementById("msg"),
    formulasPanel: document.getElementById("fP"),
    staticFormulas: document.getElementById("fStatic"),
    formula: document.getElementById("formula"),
    guidePanel: document.getElementById("guideP"),
    guide: document.getElementById("guide"),
    poolPanel: document.getElementById("poolP"),
    pool: document.getElementById("pool"),
    treePanel: document.getElementById("treeP"),
    tree: document.getElementById("tree"),
    arrayPanel: document.getElementById("arrP"),
    arrayLabel: document.getElementById("arrLbl"),
    array: document.getElementById("arr"),
    secondMessage: document.getElementById("msg2"),
    actions: document.getElementById("actions"),
    submitButton: document.getElementById("submit"),
    clearButton: document.getElementById("clearb"),
    badge: document.getElementById("badge"),
  };

  const treeGap = 72;
  const treeTop = 34;

  let values = [2, 5, 4, 11, 7, 10, 8, 15, 12];
  let heapType = "min";
  let usingGeneratedValues = true;
  let task = "array-to-tree";
  let stage = 0;
  let scatteredValues = [];
  let treeAssignments = [];
  let arrayAssignments = [];
  let results = null;
  let selectedIndex = null;
  let heldItem = null;
  let draggedItem = null;
  let guidedMode = false;
  let guideStep = 0;
  let guidePhase = "place";
  let guideValues = { k: "", p: "", l: "", r: "" };
  let guideResults = {};
  let lastMessage = "";
  let lastMessageClass = "";

  function getParentIndex(index) {
    return Math.floor((index - 1) / 2);
  }

  function getLevel(index) {
    return Math.floor(Math.log2(index + 1));
  }

  function getTreePosition(index) {
    const level = getLevel(index);
    const positionInLevel = index - (Math.pow(2, level) - 1);

    return {
      x: ((positionInLevel + 0.5) / Math.pow(2, level)) * 100,
      y: treeTop + level * treeGap,
    };
  }

  function violatesHeapOrder(parentValue, childValue) {
    return heapType === "min"
      ? parentValue > childValue
      : parentValue < childValue;
  }

  function getHeapStatus() {
    for (let index = 1; index < values.length; index += 1) {
      const parentValue = values[getParentIndex(index)];
      const childValue = values[index];

      if (violatesHeapOrder(parentValue, childValue)) {
        return {
          isValid: false,
          text:
            "Not a valid " +
            heapType +
            "-heap: parent " +
            parentValue +
            " vs child " +
            childValue,
        };
      }
    }

    return { isValid: true, text: "Valid " + heapType + "-heap" };
  }

  function createRandomHeap() {
    const size = 7 + Math.floor(Math.random() * 9);
    const heap = [];
    const usedValues = {};

    while (heap.length < size) {
      const value = 1 + Math.floor(Math.random() * 99);

      if (usedValues[value]) {
        continue;
      }

      usedValues[value] = true;
      heap.push(value);

      let index = heap.length - 1;
      while (index > 0) {
        const parentIndex = getParentIndex(index);

        if (!violatesHeapOrder(heap[parentIndex], heap[index])) {
          break;
        }

        [heap[parentIndex], heap[index]] = [heap[index], heap[parentIndex]];
        index = parentIndex;
      }
    }

    return heap;
  }

  function createRandomArray() {
    const size = 7 + Math.floor(Math.random() * 9);
    const randomValues = [];
    const usedValues = {};

    while (randomValues.length < size) {
      const value = 1 + Math.floor(Math.random() * 99);

      if (usedValues[value]) {
        continue;
      }

      usedValues[value] = true;
      randomValues.push(value);
    }

    return shuffle(randomValues);
  }

  function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
    }

    return items;
  }

  function isChipUsed(chipIndex) {
    return treeAssignments.includes(chipIndex);
  }

  function isNodeUsed(nodeIndex) {
    return arrayAssignments.includes(nodeIndex);
  }

  function getActiveAssignments() {
    return task === "array-to-tree" ? treeAssignments : arrayAssignments;
  }

  function getRemainingCount() {
    return getActiveAssignments().filter((index) => index < 0).length;
  }

  function setMessage(text, messageClass) {
    lastMessage = text;
    lastMessageClass = messageClass || "";

    [elements.message, elements.secondMessage].forEach((messageElement) => {
      messageElement.textContent = text;
      messageElement.className = messageClass || "";
    });

    if (guidedMode && elements.guide) {
      elements.guide.innerHTML = getGuideHtml();
    }
  }

  function updateStageMessage() {
    if (guidedMode && (task !== "array-to-tree" || stage === 2)) {
      const text =
        task === "array-to-tree"
          ? "Step by step: type k, then the three answers, press Check, then drag the highlighted cell into the tree."
          : "Step by step: type the parent index p, then the two answers, press Check, then drag the highlighted node into the array.";

      setMessage(text);
      return;
    }

    if (task !== "array-to-tree") {
      setMessage(
        "Read the tree. Drag each node into an array cell (or tap a node, then a cell). You can move them around freely, then press Submit. A child of index k sits at 2k+1 or 2k+2."
      );
      return;
    }

    if (stage === 0) {
      setMessage(
        "Step 1: this is the array you are given. Index 0 is the first cell, and n = " +
          values.length +
          "."
      );
    } else if (stage === 1) {
      setMessage(
        "Step 2: these formulas place every element in the tree. Tap an array cell to see them worked out."
      );
    } else {
      setMessage(
        "Drag every scattered value (or array cell) into a tree slot. Use the formulas below, move things freely, then press Submit at the bottom."
      );
    }
  }

  function clearAssignments() {
    guideStep = 0;
    guidePhase = "place";
    guideValues = { k: "", p: "", l: "", r: "" };
    guideResults = {};
    treeAssignments = values.map(() => -1);
    arrayAssignments = treeAssignments.slice();
    results = null;
    heldItem = null;
    selectedIndex = null;
  }

  function resetExercise(startWithIntro) {
    clearAssignments();
    scatteredValues = shuffle(
      values.map((value) => ({
        value,
        rotation: Math.round(Math.random() * 24 - 12),
        offset: Math.round(Math.random() * 16),
      }))
    );
    stage = startWithIntro && task === "array-to-tree" ? 0 : 2;
    elements.hint.checked = task === "array-to-tree";
    updateStageMessage();
    render();
  }

  function getTreeValue(index, isArrayToTree) {
    if (isArrayToTree) {
      const chipIndex = treeAssignments[index];
      return chipIndex > -1 ? scatteredValues[chipIndex].value : null;
    }

    return values[index];
  }

  function getArrayValue(index, isArrayToTree) {
    if (isArrayToTree) {
      return values[index];
    }

    const nodeIndex = arrayAssignments[index];
    return nodeIndex > -1 ? values[nodeIndex] : null;
  }

  function renderTree(isArrayToTree, relatedIndices, highlightedParent) {
    const count = values.length;
    const showIndices = elements.hint.checked;
    const selectedArrayIndex =
      isArrayToTree && stage === 1 ? selectedIndex : null;
    const treeHeight = treeTop + getLevel(count - 1) * treeGap + 44;
    let treeHtml = "<svg>";

    for (let index = 1; index < count; index += 1) {
      const parentPosition = getTreePosition(getParentIndex(index));
      const childPosition = getTreePosition(index);
      const parentValue = getTreeValue(getParentIndex(index), isArrayToTree);
      const childValue = getTreeValue(index, isArrayToTree);
      const isInvalid =
        (!isArrayToTree || results) &&
        parentValue !== null &&
        childValue !== null &&
        violatesHeapOrder(parentValue, childValue);

      treeHtml +=
        '<line x1="' +
        parentPosition.x +
        '%" y1="' +
        parentPosition.y +
        '" x2="' +
        childPosition.x +
        '%" y2="' +
        childPosition.y +
        '" stroke="' +
        (isInvalid ? "var(--bad)" : "var(--line)") +
        '" stroke-width="' +
        (isInvalid ? 3 : 2) +
        '"/>';
    }

    treeHtml += "</svg>";

    for (let index = 0; index < count; index += 1) {
      const position = getTreePosition(index);
      const value = getTreeValue(index, isArrayToTree);
      const nodeIsPlaced = !isArrayToTree && isNodeUsed(index);
      const isHeld =
        isArrayToTree
          ? heldItem !== null && treeAssignments[index] === heldItem
          : heldItem === index;
      const canDrag = guidedMode
        ? !isArrayToTree && index === guideStep && guidePhase === "place"
        : isArrayToTree
          ? treeAssignments[index] > -1
          : !nodeIsPlaced;
      let className = "slot";

      if (value !== null) className += " filled";
      if (selectedArrayIndex === index) className += " sel";
      if (relatedIndices[index] || index === highlightedParent) {
        className += " rel";
      }
      if (guidedMode && !isArrayToTree && index === guideStep && guideStep < count) {
        className += " cur";
      }
      if (isHeld) className += " held";
      if (nodeIsPlaced) className += " used";
      if (isArrayToTree && results) className += " " + results[index];

      treeHtml +=
        '<div class="' +
        className +
        '" tabindex="0" data-slot="' +
        index +
        '"' +
        (canDrag ? ' draggable="true"' : "") +
        ' style="left:' +
        position.x +
        "%;top:" +
        position.y +
        'px">' +
        (value !== null ? value : "") +
        (showIndices || (isArrayToTree && (value !== null || guidedMode))
          ? '<span class="ix">' + index + "</span>"
          : "") +
        "</div>";
    }

    elements.tree.style.height = treeHeight + "px";
    elements.tree.innerHTML = treeHtml;
  }

  function renderPool(isArrayToTree, currentChip) {
    elements.pool.innerHTML = scatteredValues
      .map((item, index) => {
        const isHidden =
          isChipUsed(index) || (guidedMode && index !== currentChip);
        const isLocked = guidedMode && guidePhase !== "place";
        const isHeld = isArrayToTree && heldItem === index;
        let className = "chip";

        if (isHidden) className += " gone";
        if (isLocked) className += " lock";
        if (isHeld) className += " held";

        return (
          '<div class="' +
          className +
          '" tabindex="0" draggable="' +
          (isLocked ? "false" : "true") +
          '" data-chip="' +
          index +
          '" style="transform:rotate(' +
          item.rotation +
          "deg);margin-top:" +
          item.offset +
          'px">' +
          item.value +
          "</div>"
        );
      })
      .join("");
  }

  function renderArray(isArrayToTree, relatedIndices, currentChip) {
    const count = values.length;
    let arrayHtml = "";

    for (let index = 0; index < count; index += 1) {
      const value = getArrayValue(index, isArrayToTree);
      const nodeIndex = arrayAssignments[index];
      const canDrag = guidedMode
        ? isArrayToTree &&
          stage === 2 &&
          index === guideStep &&
          guidePhase === "place" &&
          currentChip > -1
        : isArrayToTree
          ? stage === 2
          : nodeIndex > -1;
      let className = "cell";

      if (value === null) className += " empty";
      if (isArrayToTree && stage === 1 && selectedIndex === index) {
        className += " sel";
      }
      if (relatedIndices[index]) className += " rel";
      if (guidedMode && isArrayToTree && stage === 2 && index === guideStep) {
        className += " cur";
      }
      if (guidedMode && isArrayToTree && stage === 2 && index < guideStep) {
        className += " done";
      }
      if (
        guidedMode &&
        isArrayToTree &&
        heldItem !== null &&
        index === guideStep
      ) {
        className += " held";
      }
      if (!isArrayToTree && heldItem !== null && nodeIndex === heldItem) {
        className += " held";
      }
      if (!isArrayToTree && results) className += " " + results[index];

      arrayHtml +=
        '<div class="cellw"><div class="' +
        className +
        '" tabindex="0" data-cell="' +
        index +
        '"' +
        (canDrag ? ' draggable="true"' : "") +
        ">" +
        (value !== null ? value : "") +
        '</div><span class="idx">' +
        index +
        "</span></div>";
    }

    elements.array.innerHTML = arrayHtml;
    elements.arrayLabel.textContent = isArrayToTree
      ? guidedMode && stage === 2
        ? "Array q (n = " +
          count +
          "): drag the highlighted cell into the tree"
        : "Array q (n = " + count + ")"
      : "Build the array here (n = " + count + ")";
  }

  function renderFormulas(isArrayToTree) {
    elements.staticFormulas.innerHTML =
      "parent(k) = ⌊(k−1)/2⌋<br>left(k) = 2k + 1<br>right(k) = 2k + 2<br>" +
      (heapType === "min"
        ? "Min-heap: every parent ≤ its children, so the smallest is at the root."
        : "Max-heap: every parent ≥ its children, so the largest is at the root.");

    if (!isArrayToTree || stage !== 1) {
      elements.formula.innerHTML = "";
      return;
    }

    if (selectedIndex === null) {
      elements.formula.innerHTML =
        "Tap a position to work the formulas out for it.";
      return;
    }

    const index = selectedIndex;
    const leftIndex = 2 * index + 1;
    const rightIndex = 2 * index + 2;
    let formulaHtml =
      "k = " + index + " (value <b>" + values[index] + "</b>)<br>";

    formulaHtml +=
      index === 0
        ? "parent: index 0 is the root, so it has none<br>"
        : "parent = ⌊(" +
          index +
          "−1)/2⌋ = <b>" +
          getParentIndex(index) +
          "</b> → " +
          values[getParentIndex(index)] +
          "<br>";
    formulaHtml +=
      "left = 2×" +
      index +
      "+1 = <b>" +
      leftIndex +
      "</b> → " +
      (leftIndex < values.length
        ? values[leftIndex]
        : "beyond the array (" + leftIndex + " ≥ n = " + values.length + ")") +
      "<br>";
    formulaHtml +=
      "right = 2×" +
      index +
      "+2 = <b>" +
      rightIndex +
      "</b> → " +
      (rightIndex < values.length
        ? values[rightIndex]
        : "beyond the array (" + rightIndex + " ≥ n = " + values.length + ")");

    elements.formula.innerHTML = formulaHtml;
  }

  function getBriefHtml() {
    const isArrayToTree = task === "array-to-tree";
    const status = getHeapStatus();
    const exerciseText = isArrayToTree
      ? "Exercise: build the complete binary tree represented by this array."
      : "Exercise: write this tree as an array, level by level from left to right.";
    const explanation =
      heapType === "min"
        ? "Min-heap rule: every parent must be ≤ its children."
        : "Max-heap rule: every parent must be ≥ its children.";
    const taskFocus = isArrayToTree
      ? "Place each value at the tree position matching its array index. The heap rule is checked separately."
      : "Read the nodes in level order without rearranging them. The heap rule is checked separately.";
    const heapStatus = status.isValid
      ? "These values satisfy the " + heapType + "-heap rule."
      : "These values do not satisfy the " +
        heapType +
        "-heap rule; the badge identifies a parent-child violation.";

    return (
      "<b>" +
      exerciseText +
      "</b><br>" +
      explanation +
      "<br>" +
      taskFocus +
      "<br>" +
      heapStatus
    );
  }

  function getCurrentChip() {
    if (guideStep >= values.length) {
      return -1;
    }

    for (let index = 0; index < scatteredValues.length; index += 1) {
      if (
        scatteredValues[index].value === values[guideStep] &&
        !isChipUsed(index)
      ) {
        return index;
      }
    }

    return -1;
  }

  function makeInput(id, key) {
    return (
      '<input type="number" id="' +
      id +
      '" class="' +
      (guideResults[key] || "") +
      '" value="' +
      guideValues[key] +
      '" aria-label="' +
      id +
      '"> '
    );
  }

  function formatChildIndex(index) {
    return index < values.length
      ? index
      : index + " (beyond the array, no child)";
  }

  function getGuideHtml() {
    const count = values.length;
    const index = guideStep;
    const isArrayToTree = task === "array-to-tree";
    const checkButton = '<br><button data-g="1" class="on">Check</button>';
    const feedback = lastMessage
      ? '<div class="fb ' +
        lastMessageClass +
        '">' +
        lastMessage +
        "</div>"
      : "";

    if (index >= count) {
      return "All " + count + " done." + feedback;
    }

    if (isArrayToTree) {
      let guideHtml =
        "Next element: <b>" +
        values[index] +
        "</b> (the highlighted array cell).<br>";

      if (index === 0) {
        guideHtml +=
          "Index 0 is the root, so there is nothing to calculate. Drag the highlighted array cell into <b>slot 0</b>.";
      } else if (guidePhase === "calc") {
        guideHtml +=
          "k = " +
          makeInput("gk", "k") +
          " (the index written under that cell)<br>parent(k) = ⌊(k − 1) / 2⌋ = " +
          makeInput("gp", "p") +
          "<br>left(k) = 2k + 1 = " +
          makeInput("gl", "l") +
          "<br>right(k) = 2k + 2 = " +
          makeInput("gr", "r") +
          checkButton;
      } else {
        guideHtml +=
          "Correct: parent(" +
          index +
          ") = " +
          getParentIndex(index) +
          ", left(" +
          index +
          ") = " +
          formatChildIndex(2 * index + 1) +
          ", right(" +
          index +
          ") = " +
          formatChildIndex(2 * index + 2) +
          ".<br>Now drag the highlighted array cell into <b>slot " +
          index +
          "</b> of the tree.";
      }

      return guideHtml + feedback;
    }

    let guideHtml =
      "Next node: the highlighted node <b>" + values[index] + "</b>.<br>";

    if (index === 0) {
      guideHtml +=
        "It is the root, so its index is 0. Drag it into <b>cell 0</b>.";
    } else if (guidePhase === "calc") {
      guideHtml +=
        "Its parent <b>" +
        values[getParentIndex(index)] +
        "</b> is already in the array.<br>p = " +
        makeInput("gk", "k") +
        " (the index of the cell holding " +
        values[getParentIndex(index)] +
        ")<br>left(p) = 2p + 1 = " +
        makeInput("gl", "l") +
        "<br>right(p) = 2p + 2 = " +
        makeInput("gr", "r") +
        checkButton;
    } else {
      guideHtml +=
        "Correct: left(p) = " +
        (2 * getParentIndex(index) + 1) +
        ", right(p) = " +
        (2 * getParentIndex(index) + 2) +
        ".<br>The node is one of these two children. Look at the tree, then drag it into the array cell with its index.";
    }

    return guideHtml + feedback;
  }

  function render() {
    const count = values.length;
    const isArrayToTree = task === "array-to-tree";
    const status = getHeapStatus();
    const relatedIndices = {};
    const selectedArrayIndex =
      isArrayToTree && stage === 1 ? selectedIndex : null;
    const highlightedParent =
      guidedMode &&
      !isArrayToTree &&
      guideStep > 0 &&
      guideStep < count
        ? getParentIndex(guideStep)
        : -1;
    const currentChip = getCurrentChip();

    if (selectedArrayIndex !== null) {
      if (selectedArrayIndex > 0) {
        relatedIndices[getParentIndex(selectedArrayIndex)] = true;
      }
      if (2 * selectedArrayIndex + 1 < count) {
        relatedIndices[2 * selectedArrayIndex + 1] = true;
      }
      if (2 * selectedArrayIndex + 2 < count) {
        relatedIndices[2 * selectedArrayIndex + 2] = true;
      }
    }

    const showTree = !isArrayToTree || stage === 2;
    const showPool = isArrayToTree && stage === 2 && !guidedMode;
    const showFormulas = !isArrayToTree || stage >= 1;

    elements.treePanel.style.display = showTree ? "" : "none";
    elements.poolPanel.style.display = showPool ? "" : "none";
    elements.formulasPanel.style.display = showFormulas ? "" : "none";

    const showFreeActions = showTree && !guidedMode;
    elements.actions.style.display = showFreeActions ? "flex" : "none";
    elements.secondMessage.style.display = showFreeActions ? "" : "none";
    elements.message.style.display = showTree ? "none" : "";

    const arrayReference =
      guidedMode && showTree ? elements.treePanel : elements.secondMessage;
    if (elements.arrayPanel.nextElementSibling !== arrayReference) {
      elements.arrayPanel.parentNode.insertBefore(
        elements.arrayPanel,
        arrayReference
      );
    }

    elements.guidePanel.style.display =
      showTree && guidedMode ? "" : "none";
    elements.guide.innerHTML = getGuideHtml();
    elements.brief.innerHTML = getBriefHtml();
    elements.modeFreeButton.classList.toggle("on", !guidedMode);
    elements.modeGuideButton.classList.toggle("on", guidedMode);

    elements.stepper.style.display = isArrayToTree ? "flex" : "none";
    elements.stepText.textContent =
      "Step " +
      (stage + 1) +
      " of 3: " +
      ["Given array", "Formulas", "Draw the tree"][stage];
    elements.backButton.disabled = stage === 0;
    elements.nextButton.style.display = stage === 2 ? "none" : "";
    elements.nextButton.textContent =
      stage === 0 ? "Show formulas" : "I will draw it";

    const placedCount = count - getRemainingCount();
    elements.progress.max = count;
    elements.progress.value = guidedMode ? guideStep : placedCount;

    if (isArrayToTree && stage < 2) {
      elements.progressLabel.textContent =
        stage === 0 ? "Lesson: preview the array" : "Lesson: connect the indices";
      elements.progressCount.textContent = stage + 1 + " of 3";
    } else {
      elements.progressLabel.textContent = guidedMode
        ? "Guided practice"
        : "Placement practice";
      elements.progressCount.textContent = guidedMode
        ? guideStep >= count
          ? count + " of " + count + " steps complete"
          : "Step " + (guideStep + 1) + " of " + count
        : placedCount + " of " + count + " placed";
    }

    elements.badge.textContent =
      (status.isValid ? "✓ " : "✗ ") + status.text;
    elements.badge.className = status.isValid ? "" : "no";

    renderTree(isArrayToTree, relatedIndices, highlightedParent);
    renderPool(isArrayToTree, currentChip);
    renderArray(isArrayToTree, relatedIndices, currentChip);
    renderFormulas(isArrayToTree);
  }

  function moveToNextGuideStep() {
    guideStep += 1;
    guideValues = { k: "", p: "", l: "", r: "" };
    guideResults = {};
    guidePhase = "calc";
  }

  function showIncorrectPlacement(index) {
    results = values.map(() => "");
    results[index] = "bad";
    render();

    setTimeout(() => {
      results = null;
      render();
    }, 700);
  }

  function checkGuideAnswers() {
    const index = guideStep;
    const isArrayToTree = task === "array-to-tree";
    const parentIndex = getParentIndex(index);

    function readAnswer(key) {
      return guideValues[key] === ""
        ? NaN
        : parseInt(guideValues[key], 10);
    }

    const enteredIndex = readAnswer("k");
    let baseIndex;

    if (isNaN(enteredIndex)) {
      guideResults = { k: "bad" };
      setMessage("Type " + (isArrayToTree ? "k" : "p") + " first.", "bad");
      render();
      return;
    }

    if (isArrayToTree) {
      if (enteredIndex !== index) {
        guideResults = { k: "bad" };
        setMessage(
          "Not quite. k is the index written under the highlighted array cell.",
          "bad"
        );
        render();
        return;
      }
      baseIndex = index;
    } else {
      const isCorrectParent =
        enteredIndex === parentIndex ||
        (enteredIndex >= 0 &&
          enteredIndex < index &&
          values[enteredIndex] === values[parentIndex]);

      if (!isCorrectParent) {
        guideResults = { k: "bad" };
        setMessage(
          "Not quite. p is the index of the array cell that already holds " +
            values[parentIndex] +
            ".",
          "bad"
        );
        render();
        return;
      }
      baseIndex = enteredIndex;
    }

    const answers = isArrayToTree
      ? [
          [
            "p",
            "parent(" + index + ")",
            readAnswer("p"),
            parentIndex,
            "⌊(" + index + " − 1) / 2⌋, rounded down",
          ],
          [
            "l",
            "left(" + index + ")",
            readAnswer("l"),
            2 * index + 1,
            "2 × " + index + " + 1",
          ],
          [
            "r",
            "right(" + index + ")",
            readAnswer("r"),
            2 * index + 2,
            "2 × " + index + " + 2",
          ],
        ]
      : [
          [
            "l",
            "left(" + baseIndex + ")",
            readAnswer("l"),
            2 * baseIndex + 1,
            "2 × " + baseIndex + " + 1",
          ],
          [
            "r",
            "right(" + baseIndex + ")",
            readAnswer("r"),
            2 * baseIndex + 2,
            "2 × " + baseIndex + " + 2",
          ],
        ];

    guideResults = { k: "ok" };
    let hasMissingAnswer = false;
    let incorrectAnswer = null;

    answers.forEach((answer) => {
      const [key, label, enteredValue, correctValue, explanation] = answer;

      if (isNaN(enteredValue)) {
        hasMissingAnswer = true;
        guideResults[key] = "bad";
      } else if (enteredValue !== correctValue) {
        guideResults[key] = "bad";
        if (!incorrectAnswer) {
          incorrectAnswer = { label, explanation };
        }
      } else {
        guideResults[key] = "ok";
      }
    });

    if (hasMissingAnswer) {
      setMessage("Type a number in every box first.", "bad");
    } else if (incorrectAnswer) {
      setMessage(
        "Not quite. " +
          incorrectAnswer.label +
          " = " +
          incorrectAnswer.explanation +
          ". Recalculate the red box.",
        "bad"
      );
    } else {
      guidePhase = "place";
      setMessage("Correct. Now drag it into place.", "ok");
    }

    render();
  }

  function placeGuidedItem(itemIndex, targetIndex) {
    const isArrayToTree = task === "array-to-tree";
    const index = guideStep;

    if (index >= values.length) {
      return;
    }

    if (guidePhase !== "place") {
      setMessage("Finish the calculation first, then place it.", "bad");
      return;
    }

    if (targetIndex !== index) {
      setMessage(
        isArrayToTree
          ? "Not that slot. " +
              values[index] +
              " is at index " +
              index +
              ", so it goes in slot " +
              index +
              "."
          : "Not that cell. This node has index " +
              index +
              ", so it goes in cell " +
              index +
              ".",
        "bad"
      );
      showIncorrectPlacement(targetIndex);
      return;
    }

    getActiveAssignments()[targetIndex] = itemIndex;
    heldItem = null;
    selectedIndex = null;
    moveToNextGuideStep();

    if (guideStep >= values.length) {
      setMessage(
        isArrayToTree
          ? "All " +
              values.length +
              " placed. Tree complete. " +
              getHeapStatus().text +
              "."
          : "Array complete: [" + values.join(", ") + "].",
        "ok"
      );
    } else {
      setMessage(
        (isArrayToTree ? "Slot " : "Cell ") +
          targetIndex +
          " filled. Next is index " +
          guideStep +
          ".",
        "ok"
      );
    }

    render();
  }

  function placeItem(itemIndex, targetIndex) {
    if (guidedMode) {
      placeGuidedItem(itemIndex, targetIndex);
      return;
    }

    const assignments = getActiveAssignments();
    const previousIndex = assignments.indexOf(itemIndex);
    if (previousIndex > -1) {
      assignments[previousIndex] = -1;
    }

    assignments[targetIndex] = itemIndex;
    results = null;
    heldItem = null;
    selectedIndex = targetIndex;

    const remaining = getRemainingCount();
    setMessage(
      remaining
        ? values.length -
            remaining +
            " placed, " +
            remaining +
            " left. Press Submit when everything is placed."
        : "Everything is placed. Press Submit to check it."
    );
    render();
  }

  function removeItem(itemIndex) {
    const assignments = getActiveAssignments();
    const previousIndex = assignments.indexOf(itemIndex);

    if (previousIndex > -1) {
      assignments[previousIndex] = -1;
    }

    results = null;
    heldItem = null;
    setMessage(getRemainingCount() + " left to place.");
    render();
  }

  function explainIndex(index) {
    if (index === 0) {
      return "Index 0 is always the root.";
    }

    const relation =
      index % 2 === 1
        ? "left (odd index, 2k+1)"
        : "right (even index, 2k+2)";
    return (
      "Index " +
      index +
      " has parent ⌊(" +
      index +
      "−1)/2⌋ = " +
      getParentIndex(index) +
      " and is its " +
      relation +
      " child."
    );
  }

  function submitExercise() {
    const isArrayToTree = task === "array-to-tree";
    const assignments = getActiveAssignments();
    const remaining = getRemainingCount();

    if (remaining) {
      setMessage(
        "Fill every " +
          (isArrayToTree ? "slot" : "cell") +
          " first: " +
          remaining +
          " left.",
        "bad"
      );
      return;
    }

    results = values.map((_, index) => {
      const actualValue = isArrayToTree
        ? scatteredValues[assignments[index]].value
        : values[arrayAssignments[index]];
      return actualValue === values[index] ? "right" : "bad";
    });

    const correctCount = results.filter((result) => result === "right").length;
    if (correctCount === values.length) {
      setMessage(
        isArrayToTree
          ? "All " +
              correctCount +
              " correct. Tree complete. " +
              getHeapStatus().text +
              ". Press Explain step by step to see why each value goes where it does."
          : "All " +
              correctCount +
              " correct. The array is [" +
              values.join(", ") +
              "], the tree read level by level, left to right. " +
              getHeapStatus().text +
              ". Press Explain step by step to see why.",
        "ok"
      );
      render();
      return;
    }

    const incorrectIndex = results.indexOf("bad");
    let explanation;

    if (isArrayToTree) {
      const value = scatteredValues[assignments[incorrectIndex]].value;
      const valueIndex = values.indexOf(value);
      explanation =
        "Slot " +
        incorrectIndex +
        " should hold " +
        values[incorrectIndex] +
        ", but you put " +
        value +
        ". " +
        value +
        " is at array index " +
        valueIndex +
        ", so it belongs in slot " +
        valueIndex +
        ". " +
        explainIndex(valueIndex);
    } else {
      const nodeIndex = arrayAssignments[incorrectIndex];
      explanation =
        "Cell " +
        incorrectIndex +
        " should hold " +
        values[incorrectIndex] +
        ", but you put " +
        values[nodeIndex] +
        ". " +
        (nodeIndex === 0
          ? "The root is always index 0."
          : "Node " +
            values[nodeIndex] +
            " is the " +
            (nodeIndex % 2 === 1 ? "left" : "right") +
            " child of " +
            values[getParentIndex(nodeIndex)] +
            " (index " +
            getParentIndex(nodeIndex) +
            "), so its index is 2×" +
            getParentIndex(nodeIndex) +
            (nodeIndex % 2 === 1 ? "+1" : "+2") +
            " = " +
            nodeIndex +
            ".");
    }

    setMessage(
      correctCount +
        " of " +
        values.length +
        " correct. Red means wrong. " +
        explanation,
      "bad"
    );
    selectedIndex = isArrayToTree
      ? values.indexOf(scatteredValues[assignments[incorrectIndex]].value)
      : arrayAssignments[incorrectIndex];
    render();
  }

  function handleClick(event) {
    const guideButton = event.target.closest("[data-g]");
    if (guideButton) {
      checkGuideAnswers();
      return;
    }

    const isArrayToTree = task === "array-to-tree";
    const chip = event.target.closest("[data-chip]");

    if (chip) {
      const chipIndex = Number(chip.dataset.chip);

      if (
        isChipUsed(chipIndex) ||
        (guidedMode &&
          (chipIndex !== getCurrentChip() || guidePhase !== "place"))
      ) {
        return;
      }

      heldItem = heldItem === chipIndex ? null : chipIndex;
      render();
      return;
    }

    const slot = event.target.closest("[data-slot]");
    if (slot) {
      const index = Number(slot.dataset.slot);

      if (isArrayToTree) {
        if (heldItem !== null) {
          placeItem(heldItem, index);
        } else if (treeAssignments[index] > -1 && !guidedMode) {
          heldItem = treeAssignments[index];
          selectedIndex = index;
          render();
        } else {
          selectedIndex = index;
          render();
        }
      } else {
        if (
          !isNodeUsed(index) &&
          (!guidedMode || (index === guideStep && guidePhase === "place"))
        ) {
          heldItem = heldItem === index ? null : index;
        }
        selectedIndex = index;
        render();
      }
      return;
    }

    const cell = event.target.closest("[data-cell]");
    if (cell) {
      const index = Number(cell.dataset.cell);

      if (!isArrayToTree && heldItem !== null) {
        placeItem(heldItem, index);
      } else if (
        !isArrayToTree &&
        arrayAssignments[index] > -1 &&
        !guidedMode
      ) {
        heldItem = arrayAssignments[index];
        selectedIndex = index;
        render();
      } else if (
        isArrayToTree &&
        guidedMode &&
        index === guideStep &&
        guidePhase === "place" &&
        getCurrentChip() > -1
      ) {
        heldItem = heldItem === null ? getCurrentChip() : null;
        render();
      } else {
        selectedIndex = index;
        render();
      }
      return;
    }

    if (
      event.target.closest("#poolP") &&
      isArrayToTree &&
      heldItem !== null &&
      isChipUsed(heldItem)
    ) {
      removeItem(heldItem);
    } else if (
      event.target.closest("#treeP") &&
      !isArrayToTree &&
      heldItem !== null &&
      isNodeUsed(heldItem)
    ) {
      removeItem(heldItem);
    }
  }

  function handleDragStart(event) {
    const chip = event.target.closest("[data-chip]");
    const slot = event.target.closest("[data-slot]");
    const cell = event.target.closest("[data-cell]");
    let itemIndex = null;

    if (task === "array-to-tree") {
      if (chip) {
        const chipIndex = Number(chip.dataset.chip);
        if (
          !isChipUsed(chipIndex) &&
          (!guidedMode ||
            (chipIndex === getCurrentChip() && guidePhase === "place"))
        ) {
          itemIndex = chipIndex;
        }
      } else if (slot && !guidedMode) {
        const assignedChip = treeAssignments[Number(slot.dataset.slot)];
        if (assignedChip > -1) {
          itemIndex = assignedChip;
        }
      } else if (cell && guidedMode) {
        const currentChip = getCurrentChip();
        if (
          Number(cell.dataset.cell) === guideStep &&
          guidePhase === "place" &&
          currentChip > -1
        ) {
          itemIndex = currentChip;
        }
      } else if (cell && stage === 2 && !guidedMode) {
        const value = values[Number(cell.dataset.cell)];
        for (let index = 0; index < scatteredValues.length; index += 1) {
          if (
            scatteredValues[index].value === value &&
            !isChipUsed(index)
          ) {
            itemIndex = index;
            break;
          }
        }
      }
    } else if (slot) {
      const index = Number(slot.dataset.slot);
      if (
        !isNodeUsed(index) &&
        (!guidedMode || (index === guideStep && guidePhase === "place"))
      ) {
        itemIndex = index;
      }
    } else if (cell && !guidedMode) {
      const assignedNode = arrayAssignments[Number(cell.dataset.cell)];
      if (assignedNode > -1) {
        itemIndex = assignedNode;
      }
    }

    if (itemIndex === null) {
      event.preventDefault();
      return;
    }

    draggedItem = itemIndex;
    event.dataTransfer.setData("text/plain", "x");
    event.dataTransfer.effectAllowed = "move";
  }

  function getDropTarget(event) {
    const isArrayToTree = task === "array-to-tree";
    const target = event.target.closest(
      isArrayToTree ? "[data-slot]" : "[data-cell]"
    );

    if (target) {
      return {
        type: "place",
        index: Number(
          isArrayToTree ? target.dataset.slot : target.dataset.cell
        ),
      };
    }

    if (event.target.closest(isArrayToTree ? "#poolP" : "#treeP")) {
      return { type: "remove" };
    }

    return null;
  }

  function handleDragOver(event) {
    if (draggedItem !== null && getDropTarget(event)) {
      event.preventDefault();
    }
  }

  function handleDrop(event) {
    if (draggedItem === null) {
      return;
    }

    const target = getDropTarget(event);
    const itemIndex = draggedItem;
    draggedItem = null;

    if (!target) {
      return;
    }

    event.preventDefault();
    if (target.type === "place") {
      placeItem(itemIndex, target.index);
    } else {
      removeItem(itemIndex);
    }
  }

  function handleKeyboardActivation(event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const target = event.target;
    if (
      target.dataset &&
      (target.dataset.slot !== undefined ||
        target.dataset.cell !== undefined ||
        target.dataset.chip !== undefined)
    ) {
      event.preventDefault();
      target.click();
    }
  }

  function parseArrayInput() {
    const parts = elements.input.value.split(/[\s,]+/).filter(Boolean);
    const numbers = parts.map(Number);

    if (!parts.length || numbers.some(isNaN)) {
      elements.error.textContent =
        "Use numbers separated by commas, for example 2, 5, 4, 11.";
      return null;
    }

    if (numbers.length > 15) {
      elements.error.textContent =
        "Use at most 15 values so the tree fits.";
      return null;
    }

    elements.error.textContent = "";
    return numbers;
  }

  function startRandomExercise() {
    values = createRandomHeap();
    elements.input.value = values.join(", ");
    elements.error.textContent = "";
    usingGeneratedValues = true;
    resetExercise();
  }

  function startRandomArrayExercise() {
    values = createRandomArray();
    elements.input.value = values.join(", ");
    elements.error.textContent = "";
    usingGeneratedValues = false;
    resetExercise();
  }

  function setHeapType(newType) {
    heapType = newType;
    elements.minHeapButton.classList.toggle("on", newType === "min");
    elements.maxHeapButton.classList.toggle("on", newType === "max");

    if (usingGeneratedValues) {
      startRandomExercise();
    } else {
      resetExercise();
    }
  }

  function setTask(newTask) {
    task = newTask;
    elements.arrayToTreeButton.classList.toggle(
      "on",
      newTask === "array-to-tree"
    );
    elements.treeToArrayButton.classList.toggle(
      "on",
      newTask !== "array-to-tree"
    );
    resetExercise();
  }

  function loadArray() {
    const newValues = parseArrayInput();
    if (newValues) {
      values = newValues;
      usingGeneratedValues = false;
      resetExercise();
    }
  }

  function handleInput(event) {
    const inputKeys = { gk: "k", gp: "p", gl: "l", gr: "r" };
    const key = inputKeys[event.target.id];

    if (key) {
      guideValues[key] = event.target.value;
    }
  }

  function showNextStage() {
    stage = Math.min(2, stage + 1);
    selectedIndex = null;
    heldItem = null;
    updateStageMessage();
    render();
  }

  function showPreviousStage() {
    stage = Math.max(0, stage - 1);
    selectedIndex = null;
    heldItem = null;
    updateStageMessage();
    render();
  }

  function initialize() {
    elements.main.addEventListener("click", handleClick);
    elements.main.addEventListener("dragstart", handleDragStart);
    elements.main.addEventListener("dragover", handleDragOver);
    elements.main.addEventListener("drop", handleDrop);
    elements.main.addEventListener("input", handleInput);
    document.addEventListener("keydown", handleKeyboardActivation);

    elements.loadButton.addEventListener("click", loadArray);
    elements.randomButton.addEventListener("click", startRandomExercise);
    elements.randomArrayButton.addEventListener(
      "click",
      startRandomArrayExercise
    );
    elements.minHeapButton.addEventListener("click", () => setHeapType("min"));
    elements.maxHeapButton.addEventListener("click", () => setHeapType("max"));
    elements.arrayToTreeButton.addEventListener("click", () =>
      setTask("array-to-tree")
    );
    elements.treeToArrayButton.addEventListener("click", () =>
      setTask("tree-to-array")
    );
    elements.modeFreeButton.addEventListener("click", () => {
      guidedMode = false;
      resetExercise();
    });
    elements.modeGuideButton.addEventListener("click", () => {
      guidedMode = true;
      resetExercise();
    });
    elements.hint.addEventListener("change", render);
    elements.submitButton.addEventListener("click", submitExercise);
    elements.clearButton.addEventListener("click", () => {
      clearAssignments();
      updateStageMessage();
      render();
    });
    elements.nextButton.addEventListener("click", showNextStage);
    elements.backButton.addEventListener("click", showPreviousStage);

    elements.input.value = values.join(", ");
    resetExercise(true);
  }

  initialize();
})();
