import os
import argparse
import constants
import extract_features

import pickle
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import classification_report, confusion_matrix

import math
import functools
import operator

def printExit(out):
    print(out)
    exit()

def evaluate(modelDir, toCompare):
    """
    Model should be saved and loaded from disk, so the neighbour classification cost isn't incurred each run

    neigh.fit(x_train, y_train)
    pickle.dump(neigh, open(filename, 'wb'))
    
    # load from disk
    neigh = pickle.load(open(filename, 'rb'))
    result = neigh.score(X_test, Y_test)
    """
    x_train = []
    y_train = []

    testList = []

    images, pca_features, labels = pickle.load(open(os.path.join(modelDir, 'features.p'), 'rb'))
    for image, feature, label in list(zip(images, pca_features, labels)):
        #print("Image: {}, Feature: {}, Label: {}".format(image, feature, label))
        #print("Image: {}, Label: {}".format(image, label))
        #dist = math.sqrt(functools.reduce(operator.add, [pow(feature[j] - toCompare[0][j], 2) for j in range(len(toCompare[0]))]))
        #print("Distsance: {}", dist)
        #testList.append((dist, image))
        label = int(label)

        x_train.append(feature)
        y_train.append(label)
    K = 2
    neigh = KNeighborsClassifier(n_neighbors=K)
    neigh.fit(x_train, y_train)
    yPred = neigh.predict(toCompare)
    #print(neigh.score(toCompare, [4]))
    #testList.sort()
    #print(testList)
    return yPred[0]

def main(netName, checkpoint, modelDir, videoArray):
    logitsName = "gan/generator/encoder/fc6"
    ckPath = os.path.join(modelDir, f"model.ckpt-{checkpoint}")
    imagePaths = [os.path.join(constants.DATA_PATH,"custom","label.txt")]
    pcaFeatures = extract_features.extract_features(videoArray, netName, ckPath, False, logitsName, imagePaths, modelDir)

    resultString = [
        "Unknown",
        "Pass through other material",
        "Lack of scrimmed background",
        "Snackbar blocks bottom app bar",
        "Stack multiple banners",
        "Flip card to reveal information",
        "Move one card behind other card",
        "Stack multiple snackbars",
        "Lack of shadow",
        "Invisible scrime of modal bottom sheet",
    ]

    pred = evaluate(modelDir, pcaFeatures)
    return (pred, resultString[pred])

