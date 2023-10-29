const readline = require('readline');
const net = require('net');
let outputSocket;
let receivedMessages = new Map()
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt the user for the IP address and readerPort number
rl.question('Enter the reader IP address: ', (readerIPAddress) => {
  rl.question('Enter the reader port number: ', (readerPort) => {
    rl.question('Enter the output port number: ', (outputPort) => {
      rl.question('Read occurrence to retransmit (e.g., 2 for second occurence of chip: ', (occurrenceNum) => {
        // Create a TCP socket to connect to the server
        const reader = new net.Socket();
        tcpServer.createServer(outputPort);


        // Connect to the server
        reader.connect(readerPort, readerIPAddress, () => {
          console.log(`Connected to ${readerIPAddress}:${readerPort}`);
        });

        // Handle data received from the server and log it to the console
        reader.on('data', (data) => {
          //console.log('Received data from the server:', data.toString());
          tcpServer.writeData(data, occurrenceNum);
        });

        // Handle the connection close event
        reader.on('close', () => {
          console.log('Connection closed');
        });

        // Handle errors
        reader.on('error', (error) => {
          console.error('Connection error:', error.message);
        });

        // Close the readline interface when the connection is closed
        reader.on('close', () => {
          rl.close();
        });
      });
    });
  });

});

// Close the readline interface when the user presses Ctrl+C
rl.on('SIGINT', () => {
  console.log('Exiting...');
  rl.close();
});

const tcpServer = {
  createServer: function (listenPort) {
    // Create a TCP server to feed the output
    const output = net.createServer((socket) => {

      console.log('Client connected.');
      outputSocket = socket;
      // Send a welcome message to the client
      //socket.write('Welcome to the TCP server!\n');

      // Handle data received from the client
      socket.on('data', (data) => {
        console.log('Received data from client:', data.toString());

      });

      // Handle the client disconnecting
      socket.on('end', () => {
        console.log('Client disconnected.');
      });
    }

    )
    const port = listenPort;
    output.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    })
  },
  writeData: function (dataToWrite, occurrenceNum) {
    //extract ID chunk from chip read
    const idString = dataToWrite.toString('utf8').substring(4, 16);
    //console.log(idString);
    if (receivedMessages.has(idString)) {
      const count = receivedMessages.get(idString);
      if (count === occurrenceNum - 1) {
        // Retransmit the message
        outputSocket.write(dataToWrite);
      }
      receivedMessages.set(idString, count + 1);
    } else {
      receivedMessages.set(idString, 1);
      
      if (occurrenceNum == 1) {
        outputSocket.write(dataToWrite);
        // console.log('true')
      }
    }

  }
}