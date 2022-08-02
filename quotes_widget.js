function StartQuotesWidget(containerId, url) 
{
    this.tptBackendUrl = url;
    this.tptQuotesWidgetElement = document.getElementById(containerId);
    if (this.tptQuotesWidgetElement == null)
    {
      console.error(`Widget container not found by id ${containerId}`);
      return;
    }

    connect();
}

function setMessage(msg)
{
  this.tptQuotesWidgetElement.innerHTML = msg;
}

class Quote
{
  constructor(symbol, direction, bid, ask) 
  {
    this.symbol = symbol;
    this.direction = direction;
    this.bid = bid;
    this.ask = ask;
  }
}

function connect() 
{
  let counter = 0;
  let webSocket = new WebSocket(this.tptBackendUrl);

  webSocket.onopen = function (event) 
  {
      console.log('onopen: ');
      webSocket.send("{\"protocol\":\"json\",\"version\":1}\");
  };

  webSocket.onmessage = function (event) 
  {
      const json = event.data;

      console.log(`[${counter}] onmessage: ${json}`);
      counter++;

      const quotes = [];
      try 
      {
          const obj = JSON.parse(json.slice(0, -1));
          const isExistArgumentsProperty = obj.hasOwnProperty("arguments");
          if (isExistArgumentsProperty)
          {
              for(const arg in obj.arguments)
              {
                  if ("quotes" in obj.arguments[arg])
                  {
                      const quotesRaw = obj.arguments[arg]["quotes"];
                      for(const quoteIndex in quotesRaw)
                      {
                          const quoteRaw = quotesRaw[quoteIndex];
                          var quote = new Quote (quoteRaw.symbol, quoteRaw.direction, quoteRaw.bid, quoteRaw.ask);
                          quotes.push(quote);
                      }

                      // Output
                      let message = "<table class=\"quote-widget-table\" styles=\"border-spacing: 0 !important;\">";
                      message += "<thead><tr><td>Instrument</td><td>Direction</td><td>Bid</td><td>Ask</td><td>Spread</td></tr></thead><tbody>";
                      for(let quote in quotes)
                      {
                          message += "<tr>";
                          message += `<td>${quotes[quote].symbol}</td>`;
                          message += `<td>${quotes[quote].direction}</td>`;
                          message += `<td>${quotes[quote].ask}</td>`;
                          message += `<td>${quotes[quote].bid}</td>`;
                          message += `<td>${quotes[quote].ask - quotes[quote].bid}</td>`;
                          message += "</tr>";
                      }
                      message += "</tbody></table>";

                      setMessage(message);
                  }
              }
          }
      } 
      catch (err) 
      {
          console.error('Error: ', err.message);
      }
  }

  webSocket.onclose = function(event)
  {
      const RECONNECT_TIMEOUT_IN_SECONDS = 5;

      console.log(`Socket is closed. Reconnect after ${RECONNECT_TIMEOUT_IN_SECONDS} seconds.`, event.reason);
      setMessage(`The remote server is not responding. Reconnect after ${RECONNECT_TIMEOUT_IN_SECONDS} seconds.`);

      webSocket = null; // for garbage collector

      setTimeout(function() {
        connect();
      }, RECONNECT_TIMEOUT_IN_SECONDS * 1000);
  };

  webSocket.onerror = function(error) 
  {
      console.error(`[error] ${error.message}`);
      setMessage("No connection.");

      webSocket.close();
  };
}

connect();