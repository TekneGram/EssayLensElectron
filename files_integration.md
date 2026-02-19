# Goal
You will work on wiring up the workspace to the database.

# User workflow
The user selects a folder in LoaderBar
The files in the folder and lower folders are displayed in the FileDisplayBar.
When files enter the FileDisplayBar, we must check the database to see if the file information has been put into the database.
The absolute path to the current folder is stored in filepath. The path stem of a subfolder is stored in filename's append_path. The file's name is stored in filename's file_name.

Loop through each file in the folder. If the information exists in the database, we do nothing. If the information does not exist, we must enter it as new information. If a file is an image file according to the primitives that we accept, then we must insert the information into the image table.